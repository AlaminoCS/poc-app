import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { CurrentUser, AuthUser } from "./current-user.decorator";
import {
  ChangePasswordConfirmDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post("login")
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body.email, body.password, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.challengeId,
      body.code,
      body.newPassword,
    );
  }

  @Post("change-password/request")
  @UseGuards(JwtAuthGuard)
  requestChangePassword(@CurrentUser() user: AuthUser) {
    return this.authService.requestChangePassword(user.id);
  }

  @Post("change-password/confirm")
  @UseGuards(JwtAuthGuard)
  confirmChangePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordConfirmDto,
  ) {
    return this.authService.confirmChangePassword(
      user.id,
      body.challengeId,
      body.code,
      body.newPassword,
    );
  }

  @Post("verify-otp")
  verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(body.challengeId, body.code, res);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, body);
  }
}
