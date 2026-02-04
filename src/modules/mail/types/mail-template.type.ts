import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

export type EmailTemplateType = 'reset-password' | 'welcome';

export class EmailTemplatePayload {
  sender?: string | Address;
  recipients?: string | Address | Address[];
  subject?: string;
  cc?: string[];
  bcc?: string[];
  text?: string;
  html?: string;
  message?: string;
  attachments?: Attachment[];
  type?: EmailTemplateType;
}

class Attachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
}
