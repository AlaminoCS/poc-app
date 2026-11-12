import {
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  dateKeyToUtcDate,
  isHabitDueOn,
  zonedParts,
  type HabitFrequency,
} from "@poc/shared";
import { HabitsRepository } from "../habits/habits.repository";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly habitsRepository: HabitsRepository,
    private readonly config: ConfigService,
  ) {}

  async subscribe(
    userId: string,
    input: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    },
  ) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent,
      },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent,
      },
    });
    await this.usersService.updateProfile(userId, {
      notificationsEnabled: true,
    });
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
    } else {
      await this.prisma.pushSubscription.deleteMany({ where: { userId } });
    }
    const remaining = await this.prisma.pushSubscription.count({
      where: { userId },
    });
    if (remaining === 0) {
      await this.usersService.updateProfile(userId, {
        notificationsEnabled: false,
      });
    }
    return { ok: true };
  }

  assertCronAuth(header?: string) {
    const secret = this.config.get<string>("CRON_SECRET");
    if (!secret || header !== `Bearer ${secret}`) {
      throw new UnauthorizedException("Cron não autorizado");
    }
  }

  async tick() {
    const habits = await this.habitsRepository.listActiveWithUser();
    let sent = 0;

    for (const habit of habits) {
      if (!habit.remindAtTime || !habit.user.notificationsEnabled) continue;
      const tz = habit.user.timezone || "America/Sao_Paulo";
      const parts = zonedParts(new Date(), tz);
      if (
        !isHabitDueOn(
          {
            frequency: (habit.frequency as HabitFrequency) || "daily",
            weekdays: habit.weekdays ?? [],
            monthDay: habit.monthDay ?? null,
          },
          parts.dateKey,
          tz,
        )
      ) {
        continue;
      }

      const [hh, mm] = habit.remindAtTime.split(":").map(Number);
      const nowMinutes = parts.hour * 60 + parts.minute;
      const target = hh * 60 + mm;
      if (Math.abs(nowMinutes - target) > 5) continue;

      const today = dateKeyToUtcDate(parts.dateKey);
      const checked = habit.checkIns.some(
        (c) => c.date.toISOString().slice(0, 10) === parts.dateKey,
      );
      if (checked) continue;

      const already = await this.habitsRepository.findReminderLog(
        habit.id,
        today,
      );
      if (already) continue;

      const payload = JSON.stringify({
        title: "Lembrete — Hábitos",
        body: `Hora de: ${habit.title}`,
        url: "/app",
      });

      for (const sub of habit.user.pushSubscriptions) {
        const ok = await this.sendPush(sub, payload);
        if (ok) sent += 1;
      }
      await this.habitsRepository.createReminderLog(habit.id, today);
    }

    return { sent };
  }

  private async sendPush(
    sub: { endpoint: string; p256dh: string; auth: string },
    payload: string,
  ) {
    try {
      // Dynamic import keeps API bootable without web-push types in all envs
      const webpush = await import("web-push");
      const publicKey = this.config.get<string>("VAPID_PUBLIC_KEY");
      const privateKey = this.config.get<string>("VAPID_PRIVATE_KEY");
      const subject =
        this.config.get<string>("VAPID_SUBJECT") ??
        "mailto:vanderlei.jose.alamino@gmail.com";
      if (!publicKey || !privateKey) {
        this.logger.warn("VAPID keys ausentes; skip push");
        return false;
      }
      webpush.setVapidDetails(subject, publicKey, privateKey);
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      return true;
    } catch (err) {
      this.logger.warn(`Falha push: ${String(err)}`);
      return false;
    }
  }
}
