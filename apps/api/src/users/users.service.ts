import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email.trim().toLowerCase());
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  create(email: string, passwordHash: string) {
    return this.usersRepository.create({
      email: email.trim().toLowerCase(),
      passwordHash,
    });
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.usersRepository.updatePasswordHash(id, passwordHash);
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
    return this.usersRepository.updateProfile(id, data);
  }
}
