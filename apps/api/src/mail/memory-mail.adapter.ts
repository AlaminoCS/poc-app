import { Injectable, Logger } from "@nestjs/common";
import { MailMessage, MailPort } from "./mail.port";

@Injectable()
export class MemoryMailAdapter implements MailPort {
  private readonly logger = new Logger(MemoryMailAdapter.name);
  readonly sent: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    this.logger.log(`OTP em memória para ${message.to}`);
  }
}
