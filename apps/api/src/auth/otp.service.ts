import { createHash, randomInt } from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OtpService {
  constructor(private readonly config: ConfigService) {}

  generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  hashCode(code: string): string {
    return createHash("sha256").update(code).digest("hex");
  }

  matches(code: string, codeHash: string): boolean {
    return this.hashCode(code) === codeHash;
  }

  expiresAt(): Date {
    const minutes = Number(this.config.get("OTP_TTL_MINUTES") ?? 10);
    return new Date(Date.now() + minutes * 60_000);
  }
}
