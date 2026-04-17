// auth/auth-email.bridge.ts
// ─────────────────────────────────────────
// Bridge entre Better-Auth (hors NestJS DI)
// et MailService (dans NestJS DI)
// Initialisé une seule fois au bootstrap
// ─────────────────────────────────────────

type EmailHandler = (payload: {
  name: string;
  email: string;
  url: string;
  newEmail?: string;
  expireTime: string;
}) => Promise<void>;

class AuthEmailBridge {
  private verificationHandler: EmailHandler | null = null;
  private resetPasswordHandler: EmailHandler | null = null;
  private changeEmailHandler: EmailHandler | null = null;

  registerVerificationHandler(handler: EmailHandler) {
    this.verificationHandler = handler;
  }

  registerResetPasswordHandler(handler: EmailHandler) {
    this.resetPasswordHandler = handler;
  }
  updateUserEmailHandler(handler: EmailHandler) {
    this.changeEmailHandler = handler;
  }

  async sendVerification(payload: Parameters<EmailHandler>[0]) {
    if (!this.verificationHandler) {
      throw new Error('AuthEmailBridge: verificationHandler non enregistré');
    }
    return this.verificationHandler(payload);
  }

  async sendResetPassword(payload: Parameters<EmailHandler>[0]) {
    if (!this.resetPasswordHandler) {
      throw new Error('AuthEmailBridge: resetPasswordHandler non enregistré');
    }
    return this.resetPasswordHandler(payload);
  }
  async changeUserEmail(payload: Parameters<EmailHandler>[0]) {
    if (!this.changeEmailHandler) {
      throw new Error('AuthEmailBridge: changeEmailHandler non enregistré');
    }
    return this.changeEmailHandler(payload);
  }
}

// Singleton partagé entre auth.ts et NestJS
export const authEmailBridge = new AuthEmailBridge();
