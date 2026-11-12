import {
  Body,
  Controller,
  Delete,
  Headers,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Request } from "express";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

class PushKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

class SubscribeDto {
  @IsString()
  @MinLength(8)
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

class UnsubscribeDto {
  @IsOptional()
  @IsString()
  endpoint?: string;
}

@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post("notifications/subscribe")
  @UseGuards(JwtAuthGuard)
  subscribe(
    @CurrentUser() user: AuthUser,
    @Body() body: SubscribeDto,
    @Req() req: Request,
  ) {
    return this.notifications.subscribe(user.id, {
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: req.headers["user-agent"],
    });
  }

  @Delete("notifications/subscribe")
  @UseGuards(JwtAuthGuard)
  unsubscribe(@CurrentUser() user: AuthUser, @Body() body: UnsubscribeDto) {
    return this.notifications.unsubscribe(user.id, body.endpoint);
  }

  @Post("internal/reminders/tick")
  tick(@Headers("authorization") authorization?: string) {
    this.notifications.assertCronAuth(authorization);
    return this.notifications.tick();
  }
}
