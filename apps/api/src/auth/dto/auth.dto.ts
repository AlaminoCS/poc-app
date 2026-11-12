import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: "Inclua ao menos uma letra maiúscula" })
  @Matches(/[a-z]/, { message: "Inclua ao menos uma letra minúscula" })
  @Matches(/[0-9]/, { message: "Inclua ao menos um número" })
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class VerifyOtpDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: "Inclua ao menos uma letra maiúscula" })
  @Matches(/[a-z]/, { message: "Inclua ao menos uma letra minúscula" })
  @Matches(/[0-9]/, { message: "Inclua ao menos um número" })
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}

export class ChangePasswordConfirmDto {
  @IsString()
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: "Inclua ao menos uma letra maiúscula" })
  @Matches(/[a-z]/, { message: "Inclua ao menos uma letra minúscula" })
  @Matches(/[0-9]/, { message: "Inclua ao menos um número" })
  newPassword!: string;
}
