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
}
