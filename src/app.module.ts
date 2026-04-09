import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { UsersModule } from './modules/users/users.module';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { APP_GUARD } from '@nestjs/core';
import { AgencyModule } from '_root/modules/agency/agency.module';
import { PropertyModule } from '_root/modules/property/property.module';
import { BetterAuthModule } from '_root/lib/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PackModule } from '_root/modules/packs/pack.module';
import { AuthModule } from '_root/modules/auth/auth.module';
import { BuildingModule } from '_root/modules/building/building.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike(process.env.APP_NAME, {
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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10,
          limit: 1,
        },
      ],
    }),
    BetterAuthModule,
    AuthModule,
    UsersModule,
    AgencyModule,
    PropertyModule,
    BuildingModule,
    PackModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
