import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { MAIL_PORT, MailPort } from "../mail/mail.port";
import { PrismaService } from "../prisma/prisma.service";

type UnlockPayload = {
  sub: "contact-unlock";
  exp: number;
  nonce: string;
};

@Injectable()
export class ContactService {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(MAIL_PORT) private readonly mail: MailPort,
  ) {}

  async unlock(input: {
    turnstileToken: string;
    website?: string;
    ip?: string;
    userAgent?: string;
  }) {
    this.rateLimit(input.ip ?? "unknown", 8, 15 * 60_000);
    const honeypotHit = Boolean(input.website && input.website.trim());
    const turnstileOk = honeypotHit
      ? false
      : await this.verifyTurnstile(input.turnstileToken, input.ip);

    await this.prisma.contactAttempt.create({
      data: {
        ipHash: this.hash(input.ip),
        uaHash: this.hash(input.userAgent),
        turnstileOk,
        honeypotHit,
      },
    });

    if (honeypotHit) {
      return this.fakeUnlock();
    }
    if (!turnstileOk) {
      throw new BadRequestException("Verificação humana falhou. Tente de novo.");
    }

    const exp = Date.now() + 10 * 60_000;
    const payload: UnlockPayload = {
      sub: "contact-unlock",
      exp,
      nonce: randomBytes(8).toString("hex"),
    };
    const unlockToken = this.sign(payload);

    return {
      unlockToken,
      expiresAt: new Date(exp).toISOString(),
      channels: this.channels(),
    };
  }

  async message(input: {
    unlockToken: string;
    name: string;
    email: string;
    message: string;
    website?: string;
    ip?: string;
  }) {
    this.rateLimit(`msg:${input.ip ?? "unknown"}`, 3, 60 * 60_000);
    if (input.website && input.website.trim()) {
      return { ok: true };
    }
    this.verifyUnlock(input.unlockToken);

    const to =
      this.config.get<string>("CONTACT_TO_EMAIL") ??
      "vanderlei.jose.alamino@gmail.com";

    await this.mail.send({
      to,
      subject: `Contato Hábitos — ${input.name}`,
      text: `De: ${input.name} <${input.email}>\n\n${input.message}`,
      html: `<p><strong>${input.name}</strong> &lt;${input.email}&gt;</p><p>${input.message.replace(/\n/g, "<br/>")}</p>`,
    });

    return { ok: true, message: "Mensagem enviada. Obrigado!" };
  }

  private channels() {
    const phone = "(15) 98137-7293";
    const digits = "5515981377293";
    return {
      email: "vanderlei.jose.alamino@gmail.com",
      phone,
      whatsappUrl: `https://wa.me/${digits}`,
      portfolioUrl: "https://vanderlei.alamino.dev.br/",
      linkedinUrl: "https://www.linkedin.com/in/vanderlei-jose-alamino/",
    };
  }

  private fakeUnlock() {
    const exp = Date.now() + 60_000;
    return {
      unlockToken: "invalid",
      expiresAt: new Date(exp).toISOString(),
      channels: {
        email: "contato@example.com",
        phone: "(00) 00000-0000",
        whatsappUrl: "https://wa.me/5500000000000",
        portfolioUrl: "https://vanderlei.alamino.dev.br/",
        linkedinUrl: "https://www.linkedin.com/in/vanderlei-jose-alamino/",
      },
    };
  }

  private async verifyTurnstile(token: string, ip?: string) {
    const secret = this.config.get<string>("TURNSTILE_SECRET_KEY");
    const bypass =
      (this.config.get("ALLOW_TEST_OTP") ?? "false") === "true" &&
      token === "test-turnstile-token";
    if (bypass) return true;
    if (!secret) return false;

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  }

  private sign(payload: UnlockPayload) {
    const secret = this.config.getOrThrow<string>("CONTACT_HMAC_SECRET");
    const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", secret).update(raw).digest("base64url");
    return `${raw}.${sig}`;
  }

  private verifyUnlock(token: string) {
    const secret = this.config.getOrThrow<string>("CONTACT_HMAC_SECRET");
    const [raw, sig] = token.split(".");
    if (!raw || !sig) throw new BadRequestException("Token inválido");
    const expected = createHmac("sha256", secret).update(raw).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException("Token inválido");
    }
    const payload = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as UnlockPayload;
    if (payload.sub !== "contact-unlock" || payload.exp < Date.now()) {
      throw new BadRequestException("Token expirado. Verifique novamente.");
    }
  }

  private rateLimit(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      throw new HttpException(
        "Muitas tentativas. Aguarde e tente de novo.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private hash(value?: string) {
    if (!value) return null;
    return createHash("sha256").update(value).digest("hex").slice(0, 32);
  }
}
