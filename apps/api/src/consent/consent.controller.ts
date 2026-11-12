import { Body, Controller, Post, Req } from "@nestjs/common";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Request } from "express";
import { ConsentService } from "./consent.service";

class ConsentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  policyVersion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  anonymousId?: string;
}

@Controller("consent")
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  accept(@Body() body: ConsentDto, @Req() req: Request) {
    return this.consentService.accept({
      policyVersion: body.policyVersion,
      anonymousId: body.anonymousId,
      ip: req.ip,
    });
  }
}
