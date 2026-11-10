export const MAIL_PORT = Symbol("MAIL_PORT");

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface MailPort {
  send(message: MailMessage): Promise<void>;
}
