import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { MailMessage, MailPort } from "./mail.port";

@Injectable()
export class ResendMailAdapter implements MailPort {
  private readonly logger = new Logger(ResendMailAdapter.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Resend(this.config.getOrThrow<string>("RESEND_API_KEY"));
    this.from = this.config.getOrThrow<string>("RESEND_FROM");
  }

  async send(message: MailMessage): Promise<void> {
    const result = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (result.error) {
      this.logger.error(result.error.message);
      throw new ServiceUnavailableException(
        `Falha ao enviar e-mail OTP: ${result.error.message}`,
      );
    }
  }
}
