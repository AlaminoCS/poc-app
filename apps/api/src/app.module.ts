import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { ConsentModule } from "./consent/consent.module";
import { ContactModule } from "./contact/contact.module";
import { HabitsModule } from "./habits/habits.module";
import { MailModule } from "./mail/mail.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    MailModule,
    UsersModule,
    AuthModule,
    HabitsModule,
    ConsentModule,
    ContactModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
