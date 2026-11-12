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

  sign(payload: AppJwtPayload, expiresIn?: string | number): string {
    const ttl =
      expiresIn ??
      this.config.get<string>("JWT_EXPIRES_IN") ??
      "1d";
    return this.jwt.sign(payload, { expiresIn: ttl as any });
  }

  /** Converte expiresIn estilo JWT (1d, 30d, 12h) em milissegundos para cookie maxAge. */
  ttlMs(expiresIn: string): number {
    const match = /^(\d+)([dhms])$/i.exec(expiresIn.trim());
    if (!match) return 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    const mult =
      unit === "d"
        ? 24 * 60 * 60 * 1000
        : unit === "h"
          ? 60 * 60 * 1000
          : unit === "m"
            ? 60 * 1000
            : 1000;
    return n * mult;
  }
}
