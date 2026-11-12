import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type HabitWrite = {
  title?: string;
  description?: string | null;
  color?: string;
  active?: boolean;
  sortOrder?: number;
  frequency?: string;
  weekdays?: number[];
  monthDay?: number | null;
  remindAtTime?: string | null;
  remindEnabled?: boolean;
};

@Injectable()
export class HabitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByUser(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, active: true },
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 120,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  listActiveWithUser(userId?: string) {
    return this.prisma.habit.findMany({
      where: {
        active: true,
        ...(userId ? { userId } : {}),
        remindEnabled: true,
        user: { notificationsEnabled: true },
      },
      include: {
        user: { include: { pushSubscriptions: true } },
        checkIns: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    });
  }

  create(userId: string, data: HabitWrite & { title: string }) {
    return this.prisma.habit.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        color: data.color,
        frequency: data.frequency ?? "daily",
        weekdays: data.weekdays ?? [],
        monthDay: data.monthDay ?? undefined,
        remindAtTime: data.remindAtTime ?? undefined,
        remindEnabled: data.remindEnabled ?? false,
      },
      include: { checkIns: true },
    });
  }

  findOwned(habitId: string, userId: string) {
    return this.prisma.habit.findFirst({
      where: { id: habitId, userId },
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 120,
        },
      },
    });
  }

  update(habitId: string, data: HabitWrite) {
    const payload: Prisma.HabitUpdateInput = { ...data };
    return this.prisma.habit.update({
      where: { id: habitId },
      data: payload,
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 120,
        },
      },
    });
  }

  softDelete(habitId: string) {
    return this.prisma.habit.update({
      where: { id: habitId },
      data: { active: false },
    });
  }

  upsertCheckIn(habitId: string, date: Date) {
    return this.prisma.habitCheckIn.upsert({
      where: {
        habitId_date: { habitId, date },
      },
      create: { habitId, date },
      update: {},
    });
  }

  deleteCheckIn(habitId: string, date: Date) {
    return this.prisma.habitCheckIn.deleteMany({
      where: { habitId, date },
    });
  }

  findReminderLog(habitId: string, date: Date) {
    return this.prisma.reminderLog.findUnique({
      where: { habitId_date: { habitId, date } },
    });
  }

  createReminderLog(habitId: string, date: Date) {
    return this.prisma.reminderLog.create({
      data: { habitId, date },
    });
  }
}
