import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(input: { email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
      },
    });
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  updateProfile(
    id: string,
    data: {
      name?: string | null;
      birthDate?: Date | null;
      timezone?: string;
      notificationsEnabled?: boolean;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
