import { Module } from "@nestjs/common";
import { HabitsModule } from "../habits/habits.module";
import { UsersModule } from "../users/users.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [UsersModule, HabitsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
