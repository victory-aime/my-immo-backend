import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { EmailModule } from '_root/modules/mail/mail.module';
import { EmailService } from '_root/modules/mail/mail.service';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuthPrisma } from '_root/lib/auth';
import { EXPIRE_TIME } from '_root/config/enum';
import { formatExpiresIn } from '_root/modules/mail/utils/getExpiresTime';
import { twoFactor } from 'better-auth/plugins';

@Module({
  imports: [
    AuthModule.forRootAsync({
      imports: [EmailModule],
      inject: [EmailService],
      useFactory: (emailService: EmailService) => ({
        auth: betterAuth({
          session: {
            cookieCache: {
              enabled: true,
              maxAge: EXPIRE_TIME._60_MINUTES,
              strategy: 'compact',
            },
          },
          appName: process.env.APP_NAME,
          baseURL: process.env.WEB_APP_URL!,
          user: {
            additionalFields: {
              role: {
                type: 'string',
                input: false,
              },
            },
          },
          database: prismaAdapter(betterAuthPrisma, {
            provider: 'postgresql',
          }),
          emailVerification: {
            sendOnSignUp: false,
            autoSignInAfterVerification: true,
            expiresIn: EXPIRE_TIME._30_MINUTES,
            sendVerificationEmail: async ({ user, url }) => {
              if (!user.email) {
                throw new Error('User email is missing');
              }
              await emailService.sendEmailVerificationLink(
                {
                  recipients: { name: user.name, address: user.email },
                  subject: 'Verify your email address',
                },
                {
                  verificationUrl: url,
                  expireTime: formatExpiresIn(EXPIRE_TIME._30_MINUTES),
                  username: user.name,
                },
              );
            },
          },
          emailAndPassword: {
            enabled: true,
            autoSignIn: false,
            //requireEmailVerification: true,
            revokeSessionsOnPasswordReset: true,
            resetPasswordTokenExpiresIn: EXPIRE_TIME._5_MINUTES,
            sendResetPassword: async ({ user, url }) => {
              await emailService.sendResetPasswordEmailLink(
                {
                  recipients: { name: user.name, address: user.email },
                  subject: 'Reset your password',
                },
                {
                  resetPasswordUrl: url,
                  expireTime: formatExpiresIn(EXPIRE_TIME._5_MINUTES),
                  username: user?.name,
                },
              );
            },
          },
          socialProviders: {
            google: {
              enabled: true,
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              accessType: 'offline',
              prompt: 'select_account',
            },
          },
          plugins: [
            twoFactor({
              issuer: process.env.APP_NAME,
              skipVerificationOnEnable: true,
            }),
          ],
          trustedOrigins: [
            process.env.WEB_APP_URL!,
            'http://localhost:3000',
            'http://localhost:5080',
          ],
        }),
      }),
    }),
  ],
  exports: [AuthModule],
})
export class BetterAuthModule {}
