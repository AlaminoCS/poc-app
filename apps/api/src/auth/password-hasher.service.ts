import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

@Injectable()
export class PasswordHasher {
  constructor(private readonly config: ConfigService) {}

  private peppered(password: string): string {
    const pepper = this.config.getOrThrow<string>("PASSWORD_PEPPER");
    return `${password}${pepper}`;
  }

  hash(password: string): Promise<string> {
    return argon2.hash(this.peppered(password), {
      type: argon2.argon2id,
    });
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return argon2.verify(passwordHash, this.peppered(password));
  }
}
