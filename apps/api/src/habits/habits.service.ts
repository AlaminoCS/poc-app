import { Injectable, NotFoundException } from "@nestjs/common";
import type { Habit, HabitCheckIn } from "@prisma/client";
import { HabitsRepository } from "./habits.repository";

type HabitWithCheckIns = Habit & { checkIns: HabitCheckIn[] };

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async list(userId: string) {
    const habits = await this.habitsRepository.listByUser(userId);
    return habits.map((habit) => this.toDto(habit));
  }

  async create(
    userId: string,
    input: { title: string; description?: string; color?: string },
  ) {
    const habit = await this.habitsRepository.create(userId, input);
    return this.toDto(habit);
  }

  async update(
    userId: string,
    habitId: string,
    input: {
      title?: string;
      description?: string;
      color?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.requireOwned(habitId, userId);
    const habit = await this.habitsRepository.update(habitId, input);
    return this.toDto(habit);
  }

  async remove(userId: string, habitId: string) {
    await this.requireOwned(habitId, userId);
    await this.habitsRepository.softDelete(habitId);
    return { ok: true };
  }

  async toggleToday(userId: string, habitId: string) {
    const habit = await this.requireOwned(habitId, userId);
    const today = this.todayUtc();
    const checked = habit.checkIns.some(
      (checkIn) => this.toDateKey(checkIn.date) === this.toDateKey(today),
    );

    if (checked) {
      await this.habitsRepository.deleteCheckIn(habitId, today);
    } else {
      await this.habitsRepository.upsertCheckIn(habitId, today);
    }

    const refreshed = await this.requireOwned(habitId, userId);
    return this.toDto(refreshed);
  }

  private async requireOwned(habitId: string, userId: string) {
    const habit = await this.habitsRepository.findOwned(habitId, userId);
    if (!habit) {
      throw new NotFoundException("Hábito não encontrado");
    }
    return habit;
  }

  private toDto(habit: HabitWithCheckIns) {
    const today = this.todayUtc();
    const checkedToday = habit.checkIns.some(
      (checkIn) => this.toDateKey(checkIn.date) === this.toDateKey(today),
    );

    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      color: habit.color,
      active: habit.active,
      sortOrder: habit.sortOrder,
      checkedToday,
      streak: this.calculateStreak(habit.checkIns, checkedToday),
    };
  }

  private calculateStreak(checkIns: HabitCheckIn[], checkedToday: boolean) {
    const keys = new Set(checkIns.map((item) => this.toDateKey(item.date)));
    let cursor = this.todayUtc();
    if (!checkedToday) {
      cursor = this.addDays(cursor, -1);
    }

    let streak = 0;
    while (keys.has(this.toDateKey(cursor))) {
      streak += 1;
      cursor = this.addDays(cursor, -1);
    }
    return streak;
  }

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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
