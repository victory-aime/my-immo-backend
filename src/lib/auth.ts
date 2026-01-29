import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../database/prisma.service';
import { PrismaClient } from '_prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export const auth = betterAuth({
  database: prismaAdapter(PrismaService, {
    provider: 'postgresql',
  }),
});

export const betterAuthPrisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});
