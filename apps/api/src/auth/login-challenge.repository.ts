import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LoginChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
    purpose?: "login" | "password_reset" | "password_change";
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.loginChallenge.create({
      data: {
        userId: input.userId,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        purpose: input.purpose ?? "login",
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  }

  findById(id: string) {
    return this.prisma.loginChallenge.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  consume(id: string) {
    return this.prisma.loginChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
