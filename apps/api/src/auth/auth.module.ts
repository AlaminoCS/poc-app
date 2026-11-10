import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtTokenService } from "./jwt-token.service";
import { JwtStrategy } from "./jwt.strategy";
import { LoginChallengeRepository } from "./login-challenge.repository";
import { OtpService } from "./otp.service";
import { PasswordHasher } from "./password-hasher.service";

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: 60 * 60 * 24,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasher,
    OtpService,
    JwtTokenService,
    LoginChallengeRepository,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [PasswordHasher, JwtAuthGuard],
})
export class AuthModule {}
