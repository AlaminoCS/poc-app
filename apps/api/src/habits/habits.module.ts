import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { HabitsController } from "./habits.controller";
import { HabitsRepository } from "./habits.repository";
import { HabitsService } from "./habits.service";

@Module({
  imports: [UsersModule],
  controllers: [HabitsController],
  providers: [HabitsRepository, HabitsService],
  exports: [HabitsRepository, HabitsService],
})
export class HabitsModule {}
