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
      useFactory: () => ({
        auth: betterAuth({
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
          emailAndPassword: {
            enabled: true,
            autoSignIn: false,
          },
          socialProviders: {
            google: {
              enabled: true,
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
              accessType: 'offline',
            },
          },
          plugins: [
            twoFactor({
              issuer: process.env.APP_NAME,
              skipVerificationOnEnable: true,
            }),
          ],
          trustedOrigins: [process.env.WEB_APP_URL!],
        }),
      }),
    }),
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
