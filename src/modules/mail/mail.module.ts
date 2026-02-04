import { EmailService } from './mail.service';
import { CompileTemplateService } from './utils/compile-templates';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('GMAIL_HOST'),
          port: Number(configService.get<string>('GMAIL_PORT')),
          secure: false,
          auth: {
            user: configService.get<string>('GMAIL_CLIENT_EMAIL'),
            pass: configService.get<string>('GMAIL_CLIENT_PASSWORD'),
          },
        },
      }),
    }),
  ],
  providers: [EmailService, CompileTemplateService],
  exports: [EmailService, CompileTemplateService],
})
export class EmailModule {}
