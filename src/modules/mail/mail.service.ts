import { Injectable } from '@nestjs/common';
import { EmailTemplatePayload } from './types/mail-template.type';
import { MailerService } from '@nestjs-modules/mailer';
import { CompileTemplateService } from './utils/compile-templates';

@Injectable()
export class EmailService {
  /**
   * Service to send emails using the MailerService.
   * It compiles email templates and sends them to specified recipients.
   */
  constructor(
    private readonly mailService: MailerService,
    private readonly compileTemplate: CompileTemplateService,
  ) {}

  async sendEmailVerificationLink(
    emailDto: EmailTemplatePayload,
    context: {
      verificationUrl: string;
      expireTime: number | string;
      username: string;
    },
  ): Promise<void> {
    const { recipients, subject } = emailDto;
    const html = await this.compileTemplate.compileTemplate(
      'hbs',
      'email-verification',
      context,
    );
    try {
      const mailOptions = {
        from: process.env.GOOGLE_CLIENT_EMAIL,
        replyTo: process.env.GOOGLE_CLIENT_EMAIL,
        to: recipients,
        subject,
        html,
      };
      await this.mailService.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Error sending email: ${error}`);
    }
  }

  async sendResetPasswordEmailLink(
    emailDto: EmailTemplatePayload,
    context: {
      resetPasswordUrl: string;
      expireTime: string | number;
      username: string;
    },
  ): Promise<void> {
    const { recipients, subject } = emailDto;
    const html = await this.compileTemplate.compileTemplate(
      'hbs',
      'reset-password',
      context,
    );
    try {
      const mailOptions = {
        from: process.env.GOOGLE_CLIENT_EMAIL,
        replyTo: process.env.GOOGLE_CLIENT_EMAIL,
        to: recipients,
        subject,
        html,
      };
      await this.mailService.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Error sending email: ${error}`);
    }
  }
}
