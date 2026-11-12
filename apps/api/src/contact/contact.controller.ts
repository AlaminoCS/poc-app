import { Body, Controller, Post, Req } from "@nestjs/common";
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Request } from "express";
import { ContactService } from "./contact.service";

class UnlockDto {
  @IsString()
  @MinLength(1)
  turnstileToken!: string;

  @IsOptional()
  @IsString()
  website?: string;
}

class MessageDto {
  @IsString()
  @MinLength(1)
  unlockToken!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  website?: string;
}

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post("unlock")
  unlock(@Body() body: UnlockDto, @Req() req: Request) {
    return this.contactService.unlock({
      turnstileToken: body.turnstileToken,
      website: body.website,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Post("message")
  message(@Body() body: MessageDto, @Req() req: Request) {
    return this.contactService.message({
      unlockToken: body.unlockToken,
      name: body.name,
      email: body.email,
      message: body.message,
      website: body.website,
      ip: req.ip,
    });
  }
}
