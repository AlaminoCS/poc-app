import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Habit, HabitCheckIn } from "@prisma/client";
import {
  dateKeyToUtcDate,
  isHabitDueOn,
  zonedParts,
  type DaySummaryDto,
  type HabitFrequency,
} from "@poc/shared";
import { UsersService } from "../users/users.service";
import { HabitsRepository } from "./habits.repository";

type HabitWithCheckIns = Habit & { checkIns: HabitCheckIn[] };

type HabitInput = {
  title?: string;
  description?: string | null;
  color?: string;
  active?: boolean;
  sortOrder?: number;
  frequency?: HabitFrequency;
  weekdays?: number[];
  monthDay?: number | null;
  remindAtTime?: string | null;
  remindEnabled?: boolean;
};

@Injectable()
export class HabitsService {
  constructor(
    private readonly habitsRepository: HabitsRepository,
    private readonly usersService: UsersService,
  ) {}

  async list(userId: string) {
    const user = await this.usersService.findById(userId);
    const tz = user?.timezone ?? "America/Sao_Paulo";
    const habits = await this.habitsRepository.listByUser(userId);
    return habits.map((habit) => this.toDto(habit, tz));
  }

  async create(userId: string, input: HabitInput & { title: string }) {
    const user = await this.usersService.findById(userId);
    const tz = user?.timezone ?? "America/Sao_Paulo";
    this.assertSchedule(input);
    const habit = await this.habitsRepository.create(userId, {
      ...input,
      frequency: input.frequency ?? "daily",
      weekdays: input.weekdays ?? [],
    });
    return this.toDto(habit, tz);
  }

  async update(userId: string, habitId: string, input: HabitInput) {
    const user = await this.usersService.findById(userId);
    const tz = user?.timezone ?? "America/Sao_Paulo";
    await this.requireOwned(habitId, userId);
    this.assertSchedule(input);
    const habit = await this.habitsRepository.update(habitId, input);
    return this.toDto(habit, tz);
  }

  async remove(userId: string, habitId: string) {
    await this.requireOwned(habitId, userId);
    await this.habitsRepository.softDelete(habitId);
    return { ok: true };
  }

  async toggleToday(userId: string, habitId: string) {
    const user = await this.usersService.findById(userId);
    const tz = user?.timezone ?? "America/Sao_Paulo";
    const habit = await this.requireOwned(habitId, userId);
    const todayKey = zonedParts(new Date(), tz).dateKey;
    const today = dateKeyToUtcDate(todayKey);

    if (!isHabitDueOn(this.scheduleOf(habit), todayKey, tz)) {
      throw new BadRequestException("Este hábito não está previsto para hoje.");
    }

    const checked = habit.checkIns.some(
      (checkIn) => this.toDateKey(checkIn.date) === todayKey,
    );

    if (checked) {
      await this.habitsRepository.deleteCheckIn(habitId, today);
    } else {
      await this.habitsRepository.upsertCheckIn(habitId, today);
    }

    const refreshed = await this.requireOwned(habitId, userId);
    return this.toDto(refreshed, tz);
  }

  async summary(userId: string, from: string, to: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException("from/to devem ser YYYY-MM-DD");
    }
    const user = await this.usersService.findById(userId);
    const tz = user?.timezone ?? "America/Sao_Paulo";
    const habits = await this.habitsRepository.listByUser(userId);
    const days: DaySummaryDto[] = [];

    let cursor = dateKeyToUtcDate(from);
    const end = dateKeyToUtcDate(to);
    while (cursor.getTime() <= end.getTime()) {
      const dateKey = this.toDateKey(cursor);
      const due = habits.filter((h) =>
        isHabitDueOn(this.scheduleOf(h), dateKey, tz),
      );
      const doneIds = due
        .filter((h) =>
          h.checkIns.some((c) => this.toDateKey(c.date) === dateKey),
        )
        .map((h) => h.id);
      const missing = due.filter((h) => !doneIds.includes(h.id)).map((h) => h.id);
      const expected = due.length;
      const done = doneIds.length;
      let status: DaySummaryDto["status"] = "none";
      if (expected === 0) status = "none";
      else if (done === 0) status = "empty";
      else if (done < expected) status = "partial";
      else status = "complete";

      days.push({
        date: dateKey,
        expected,
        done,
        status,
        missingHabitIds: missing,
        doneHabitIds: doneIds,
      });
      cursor = this.addDays(cursor, 1);
    }

    return { from, to, days };
  }

  private assertSchedule(input: HabitInput) {
    if (input.frequency === "weekly" && input.weekdays && input.weekdays.length === 0) {
      throw new BadRequestException("Selecione ao menos um dia da semana.");
    }
  }

  private scheduleOf(habit: Habit) {
    return {
      frequency: (habit.frequency as HabitFrequency) || "daily",
      weekdays: habit.weekdays ?? [],
      monthDay: habit.monthDay ?? null,
    };
  }

  private async requireOwned(habitId: string, userId: string) {
    const habit = await this.habitsRepository.findOwned(habitId, userId);
    if (!habit) {
      throw new NotFoundException("Hábito não encontrado");
    }
    return habit;
  }

  private toDto(habit: HabitWithCheckIns, tz: string) {
    const todayKey = zonedParts(new Date(), tz).dateKey;
    const dueToday = isHabitDueOn(this.scheduleOf(habit), todayKey, tz);
    const checkedToday = habit.checkIns.some(
      (checkIn) => this.toDateKey(checkIn.date) === todayKey,
    );

    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      color: habit.color,
      active: habit.active,
      sortOrder: habit.sortOrder,
      frequency: (habit.frequency as HabitFrequency) || "daily",
      weekdays: habit.weekdays ?? [],
      monthDay: habit.monthDay ?? null,
      remindAtTime: habit.remindAtTime ?? null,
      remindEnabled: habit.remindEnabled,
      dueToday,
      checkedToday,
      streak: this.calculateStreak(habit, tz, checkedToday),
    };
  }

  private calculateStreak(
    habit: HabitWithCheckIns,
    tz: string,
    checkedToday: boolean,
  ) {
    const keys = new Set(habit.checkIns.map((item) => this.toDateKey(item.date)));
    let cursorKey = zonedParts(new Date(), tz).dateKey;
    let cursor = dateKeyToUtcDate(cursorKey);
    if (!checkedToday) {
      cursor = this.addDays(cursor, -1);
      cursorKey = this.toDateKey(cursor);
    }

    let streak = 0;
    for (let i = 0; i < 400; i += 1) {
      if (!isHabitDueOn(this.scheduleOf(habit), cursorKey, tz)) {
        cursor = this.addDays(cursor, -1);
        cursorKey = this.toDateKey(cursor);
        continue;
      }
      if (!keys.has(cursorKey)) break;
      streak += 1;
      cursor = this.addDays(cursor, -1);
      cursorKey = this.toDateKey(cursor);
    }
    return streak;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
