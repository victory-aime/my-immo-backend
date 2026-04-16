import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { EXPIRE_TIME } from '../config/enum';
import { twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { expo } from '@better-auth/expo';
import { authEmailBridge } from '../modules/auth/auth-email.bridge';
import { formatExpiresIn } from '../modules/mail/utils/getExpiresTime';
import { prisma } from '../../prisma/seed/client';
import { customSession } from 'better-auth/plugins/custom-session';

// ─────────────────────────────────────────
// INSTANCE SINGLETON
// ─────────────────────────────────────────
type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | null = null;

export const getAuthInstance = (): AuthInstance => {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
};

// ─────────────────────────────────────────
// CONFIGURATION BETTER-AUTH
//
// Responsabilités de Better-Auth :
//   ✅ Gestion des sessions / cookies
//   ✅ Hash des passwords
//   ✅ Création User + Account (OAuth, credentials)
//   ✅ Génération des tokens (vérification, reset)
//   ✅ 2FA, Passkey, Expo
//   ✅ Google OAuth
//
export const createAuth = (): ReturnType<typeof betterAuth> => {
  return betterAuth({
    appName: process.env.APP_NAME,
    baseURL: process.env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    session: {
      deferSessionRefresh: true,
      //disableSessionRefresh: true,
      cookieCache: {
        enabled: true,
        maxAge: EXPIRE_TIME._30_MINUTES,
        strategy: 'compact',
      },
    },

    user: {
      deleteUser: {
        enabled: true,
      },
      additionalFields: {
        role: {
          type: 'string',
          input: false,
        },
        status: {
          type: 'boolean',
          input: false,
        },
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: EXPIRE_TIME._30_MINUTES,
      sendVerificationEmail: async ({ user, token }) => {
        console.log(
          'link',
          `${process.env.FRONTEND_EMAIL_VERIFIED_URL}/?token=${token}`,
        );
        await authEmailBridge.sendVerification({
          name: user.name,
          email: user.email,
          url: `${process.env.FRONTEND_EMAIL_VERIFIED_URL}/?token=${token}`,
          expireTime: formatExpiresIn(EXPIRE_TIME._30_MINUTES),
        });
      },
    },

    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: EXPIRE_TIME._5_MINUTES,
      sendResetPassword: async ({ user, token }) => {
        await authEmailBridge.sendResetPassword({
          name: user.name,
          email: user.email,
          url: `${process.env.FRONTEND_RESET_PASSWORD_URL}/?token=${token}`,
          expireTime: formatExpiresIn(EXPIRE_TIME._5_MINUTES),
        });
      },
    },

    socialProviders: {
      google: {
        enabled: true,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    plugins: [
      customSession(async ({ user, session }) => {
        const staff = await prisma.staff.findFirst({
          where: { userId: user.id },
          include: {
            permissions: {
              where: { granted: true },
              include: {
                permission: {
                  select: {
                    name: true,
                    feature: {
                      select: { name: true, category: true },
                    },
                  },
                },
              },
            },
          },
        });

        const permissions =
          staff?.permissions.map((p) => ({
            name: p.permission?.name,
            feature: p.permission?.feature.name,
            category: p.permission?.feature.category,
          })) || [];

        return {
          user,
          session: {
            ...session,
            permissions,
          },
        };
      }),
      twoFactor({
        issuer: process.env.APP_NAME,
        skipVerificationOnEnable: true,
      }),
      passkey(),
      expo(),
    ],

    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:5080',
      'http://localhost:8082',
      'http://localhost:8081',
      'exp://',
      'exp://**',
      'exp://192.168.*.*:*/**',
    ],
  });
};
