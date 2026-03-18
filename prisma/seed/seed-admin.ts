import { prisma } from './client';
import { auth } from '../../src/lib/auth';

async function main() {
  console.log('🌱 Seeding database...');

  // Vérifier si l'admin existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingUser) {
    // Utiliser l'API de Better Auth pour créer l'utilisateur
    // (gère automatiquement le hachage du mot de passe)
    const { user } = await auth.api.signUpEmail({
      body: {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'V1ct0r!!A@dm!!n',
      },
    });

    if (user) {
      await prisma.user.update({
        where: { email: user?.email },
        data: {
          role: 'ADMIN',
        },
      });
    }

    console.log('✅ Default admin user created');
  } else {
    console.log('⏭️  Admin user already exists, skipping');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
