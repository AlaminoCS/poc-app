import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import {
  MIN_USER_AGE,
  ageFromBirthDate,
  isBirthdayToday,
} from "@poc/shared";
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
    return this.toAuthUser(user);
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

  async requestChangePassword(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();

    const code = this.otpService.generateCode();
    const challenge = await this.challenges.create({
      userId: user.id,
      codeHash: this.otpService.hashCode(code),
      expiresAt: this.otpService.expiresAt(),
      purpose: "password_change",
    });

    await this.mail.send({
      to: user.email,
      subject: "Confirmar nova senha — Hábitos",
      text: `Seu código para alterar a senha é ${code}.`,
      html: this.otpEmailHtml("Use este código para confirmar a nova senha:", code),
    });

    const allowTestOtp = (this.config.get("ALLOW_TEST_OTP") ?? "false") === "true";
    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
      message: "Enviamos um código OTP para confirmar a troca de senha.",
      ...(allowTestOtp ? { debugOtp: code } : {}),
    };
  }

  async confirmChangePassword(
    userId: string,
    challengeId: string,
    code: string,
    newPassword: string,
  ) {
    const challenge = await this.challenges.findById(challengeId);
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.purpose !== "password_change" ||
      challenge.userId !== userId
    ) {
      throw new BadRequestException("Desafio inválido ou já utilizado");
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Código expirado. Solicite novamente.");
    }

    if (!this.otpService.matches(code, challenge.codeHash)) {
      throw new UnauthorizedException("Código OTP inválido");
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.usersService.updatePasswordHash(userId, passwordHash);
    await this.challenges.consume(challenge.id);

    return { message: "Senha atualizada com sucesso." };
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string | null;
      birthDate?: string | null;
      timezone?: string;
      notificationsEnabled?: boolean;
    },
  ) {
    let birthDate: Date | null | undefined = undefined;
    if (input.birthDate === null) birthDate = null;
    else if (typeof input.birthDate === "string") {
      const age = ageFromBirthDate(input.birthDate, input.timezone ?? "America/Sao_Paulo");
      if (age < MIN_USER_AGE) {
        throw new BadRequestException(
          `Idade mínima: ${MIN_USER_AGE} anos (LGPD).`,
        );
      }
      birthDate = new Date(`${input.birthDate}T12:00:00.000Z`);
    }

    const user = await this.usersService.updateProfile(userId, {
      name: input.name,
      birthDate,
      timezone: input.timezone,
      notificationsEnabled: input.notificationsEnabled,
    });
    return this.toAuthUser(user);
  }

  async verifyOtp(
    challengeId: string,
    code: string,
    res: Response,
    rememberMe = false,
  ) {
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

    const expiresIn = rememberMe
      ? (this.config.get<string>("JWT_EXPIRES_IN_REMEMBER") ?? "30d")
      : (this.config.get<string>("JWT_EXPIRES_IN") ?? "1d");

    const token = this.jwtTokenService.sign(
      {
        sub: challenge.user.id,
        email: challenge.user.email,
      },
      expiresIn,
    );

    const secure = (this.config.get("COOKIE_SECURE") ?? "false") === "true";
    res.cookie("access_token", token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: this.jwtTokenService.ttlMs(expiresIn),
    });

    return this.toAuthUser(challenge.user);
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

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name?: string | null;
    birthDate?: Date | null;
    timezone?: string;
    notificationsEnabled?: boolean;
  }) {
    const timezone = user.timezone ?? "America/Sao_Paulo";
    const birthDate = user.birthDate
      ? user.birthDate.toISOString().slice(0, 10)
      : null;
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      birthDate,
      timezone,
      notificationsEnabled: user.notificationsEnabled ?? false,
      isBirthdayToday: isBirthdayToday(user.birthDate, timezone),
      age: birthDate ? ageFromBirthDate(birthDate, timezone) : null,
    };
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
