import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MAIL_PORT } from "./mail.port";
import { MemoryMailAdapter } from "./memory-mail.adapter";
import { ResendMailAdapter } from "./resend-mail.adapter";

@Global()
@Module({
  providers: [
    ResendMailAdapter,
    MemoryMailAdapter,
    {
      provide: MAIL_PORT,
      inject: [ConfigService, ResendMailAdapter, MemoryMailAdapter],
      useFactory: (
        config: ConfigService,
        resend: ResendMailAdapter,
        memory: MemoryMailAdapter,
      ) => {
        const driver = config.get<string>("MAIL_DRIVER");
        const allowTestOtp = config.get<string>("ALLOW_TEST_OTP") === "true";
        if (driver === "memory" || allowTestOtp) {
          return memory;
        }
        return resend;
      },
    },
  ],
  exports: [MAIL_PORT],
})
export class MailModule {}
