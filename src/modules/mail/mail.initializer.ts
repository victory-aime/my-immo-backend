// modules/mail/auth-mail.initializer.ts
// ─────────────────────────────────────────
// Enregistre les handlers email dans le bridge
// au démarrage de NestJS (OnModuleInit)
// ─────────────────────────────────────────
import { Injectable, OnModuleInit } from '@nestjs/common';
import { authEmailBridge } from '_root/modules/auth/auth-email.bridge';
import { EmailService } from './mail.service';
import { formatExpiresIn } from './utils/getExpiresTime';
import { EXPIRE_TIME } from '_root/config/enum';

@Injectable()
export class AuthMailInitializer implements OnModuleInit {
  constructor(private readonly emailService: EmailService) {}

  onModuleInit() {
    // Enregistrer le handler de vérification email
    authEmailBridge.registerVerificationHandler(
      async ({ name, email, url }) => {
        await this.emailService.sendEmailVerificationLink(
          {
            recipients: { name, address: email },
            subject: 'Confirmez votre adresse email',
          },
          {
            verificationUrl: url,
            expireTime: formatExpiresIn(EXPIRE_TIME._30_MINUTES),
            username: name,
          },
        );
      },
    );

    // Enregistrer le handler de reset password
    authEmailBridge.registerResetPasswordHandler(
      async ({ name, email, url }) => {
        await this.emailService.sendResetPasswordEmailLink(
          {
            recipients: { name, address: email },
            subject: 'Réinitialisation de votre mot de passe',
          },
          {
            resetPasswordUrl: url,
            expireTime: formatExpiresIn(EXPIRE_TIME._5_MINUTES),
            username: name,
          },
        );
      },
    );
  }
}
