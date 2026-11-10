import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export type AppJwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  sign(payload: AppJwtPayload): string {
    return this.jwt.sign(payload);
  }
}
