import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { MAIL_PORT, MailPort } from "../mail/mail.port";
import { UsersService } from "../users/users.service";
import { JwtTokenService } from "./jwt-token.service";
import { LoginChallengeRepository } from "./login-challenge.repository";
import { OtpService } from "./otp.service";
import { PasswordHasher } from "./password-hasher.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly otpService: OtpService,
    private readonly challenges: LoginChallengeRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly config: ConfigService,
    @Inject(MAIL_PORT) private readonly mail: MailPort,
  ) {}

  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.usersService.create(normalizedEmail, passwordHash);
    return { id: user.id, email: user.email };
  }

  async login(
    email: string,
    password: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const valid = await this.passwordHasher.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const code = this.otpService.generateCode();
    const challenge = await this.challenges.create({
      userId: user.id,
      codeHash: this.otpService.hashCode(code),
      expiresAt: this.otpService.expiresAt(),
      purpose: "login",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    await this.mail.send({
      to: user.email,
      subject: "Seu código de acesso — Hábitos",
      text: `Seu código OTP é ${code}. Ele expira em poucos minutos.`,
      html: this.otpEmailHtml("Use este código para concluir o login:", code),
    });

    const allowTestOtp = (this.config.get("ALLOW_TEST_OTP") ?? "false") === "true";

    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
      message: "Enviamos um código OTP para o seu e-mail.",
      ...(allowTestOtp ? { debugOtp: code } : {}),
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const allowTestOtp = (this.config.get("ALLOW_TEST_OTP") ?? "false") === "true";
    const message =
      "Se o e-mail existir, enviamos um código para redefinir a senha.";

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      return { message };
    }

    const code = this.otpService.generateCode();
    const challenge = await this.challenges.create({
      userId: user.id,
      codeHash: this.otpService.hashCode(code),
      expiresAt: this.otpService.expiresAt(),
      purpose: "password_reset",
    });

    await this.mail.send({
      to: user.email,
      subject: "Redefinir senha — Hábitos",
      text: `Seu código para redefinir a senha é ${code}. Ele expira em poucos minutos.`,
      html: this.otpEmailHtml("Use este código para redefinir a senha:", code),
    });

    return {
      message,
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
      ...(allowTestOtp ? { debugOtp: code } : {}),
    };
  }

  async resetPassword(challengeId: string, code: string, newPassword: string) {
    const challenge = await this.challenges.findById(challengeId);
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.purpose !== "password_reset"
    ) {
      throw new BadRequestException("Desafio inválido ou já utilizado");
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        "Código expirado. Solicite a redefinição novamente.",
      );
    }

    if (!this.otpService.matches(code, challenge.codeHash)) {
      throw new UnauthorizedException("Código OTP inválido");
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.usersService.updatePasswordHash(challenge.userId, passwordHash);
    await this.challenges.consume(challenge.id);

    return {
      message: "Senha atualizada. Entre com a nova senha.",
      email: challenge.user.email,
    };
  }

  async verifyOtp(challengeId: string, code: string, res: Response) {
    const challenge = await this.challenges.findById(challengeId);
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.purpose !== "login"
    ) {
      throw new BadRequestException("Desafio inválido ou já utilizado");
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Código expirado. Faça login novamente.");
    }

    if (!this.otpService.matches(code, challenge.codeHash)) {
      throw new UnauthorizedException("Código OTP inválido");
    }

    await this.challenges.consume(challenge.id);

    const token = this.jwtTokenService.sign({
      sub: challenge.user.id,
      email: challenge.user.email,
    });

    const secure = (this.config.get("COOKIE_SECURE") ?? "false") === "true";
    res.cookie("access_token", token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      id: challenge.user.id,
      email: challenge.user.email,
    };
  }

  logout(res: Response) {
    const secure = (this.config.get("COOKIE_SECURE") ?? "false") === "true";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });
    return { ok: true };
  }

  me(user: { id: string; email: string }) {
    return { id: user.id, email: user.email };
  }

  private otpEmailHtml(intro: string, code: string) {
    return `
      <div style="font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#0B1020;color:#fff">
        <h1 style="color:#FF4D6D;margin:0 0 12px">Hábitos</h1>
        <p style="margin:0 0 16px;color:#D7DEFF">${intro}</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 16px;color:#7CFFB2">${code}</p>
        <p style="margin:0;color:#9AA6D9;font-size:13px">Se você não solicitou, ignore este e-mail.</p>
      </div>
    `;
  }
}
