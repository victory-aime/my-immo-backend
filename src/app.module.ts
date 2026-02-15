import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { UsersModule } from './modules/users/users.module';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuthPrisma } from '_root/lib/auth';
import { APP_GUARD } from '@nestjs/core';
import { twoFactor } from 'better-auth/plugins';
import { EmailService } from '_root/modules/mail/mail.service';
import { EmailModule } from '_root/modules/mail/mail.module';
import { formatExpiresIn } from '_root/modules/mail/utils/getExpiresTime';
import { EXPIRE_TIME } from '_root/config/enum';
import { AgencyModule } from '_root/modules/agency/agency.module';
import { PropertyModule } from '_root/modules/property/property.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('Rental-Platform', {
              colors: true,
              prettyPrint: true,
              processId: true,
              appName: true,
            }),
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      isGlobal: true,
    }),
    AuthModule.forRootAsync({
      imports: [EmailModule],
      inject: [EmailService],
      useFactory: (emailService: EmailService) => ({
        auth: betterAuth({
          session: {
            cookieCache: {
              enabled: true,
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
            requireEmailVerification: true,
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
    UsersModule,
    AgencyModule,
    PropertyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
