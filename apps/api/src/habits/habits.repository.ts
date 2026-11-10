import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HabitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByUser(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, active: true },
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 60,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  create(
    userId: string,
    data: { title: string; description?: string; color?: string },
  ) {
    return this.prisma.habit.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        color: data.color,
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
          take: 60,
        },
      },
    });
  }

  update(
    habitId: string,
    data: {
      title?: string;
      description?: string;
      color?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.prisma.habit.update({
      where: { id: habitId },
      data,
      include: {
        checkIns: {
          orderBy: { date: "desc" },
          take: 60,
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
}
