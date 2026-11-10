import { Global, Module } from "@nestjs/common";
import { MAIL_PORT } from "./mail.port";
import { ResendMailAdapter } from "./resend-mail.adapter";

@Global()
@Module({
  providers: [
    ResendMailAdapter,
    {
      provide: MAIL_PORT,
      useExisting: ResendMailAdapter,
    },
  ],
  exports: [MAIL_PORT],
})
export class MailModule {}
