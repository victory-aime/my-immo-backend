// prisma/seed.ts
import {
  PropertyAgencyStatus,
  PropertyType,
  UserRole,
} from '../generated/client';
import { hashPassword } from './hash-password';
import { prisma } from './client';

async function main() {
  const passwordHash = await hashPassword('Password123!');

  const owner = await prisma.user.create({
    data: {
      name: 'Jean Owner',
      email: 'owner@myimmo.com',
      emailVerified: true,
      role: UserRole.IMMO_OWNER,
      accounts: {
        create: {
          providerId: 'credentials',
          accountId: 'owner@myimmo.com',
          password: passwordHash,
        },
      },
    },
  });
  // ===============================
  // 2️⃣ CLIENT USER
  // ===============================
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@myimmo.com' },
    update: {},
    create: {
      name: 'Alice Client',
      email: 'client@myimmo.com',
      emailVerified: true,
      role: UserRole.USER,
      accounts: {
        create: {
          providerId: 'credentials',
          accountId: 'client@myimmo.com',
          password: passwordHash,
        },
      },
    },
  });

  // ===============================
  // 3️⃣ PROPERTY OWNER PROFILE
  // ===============================
  const propertyOwner = await prisma.propertyOwner.create({
    data: {
      userId: owner.id,
    },
  });

  // ===============================
  // 4️⃣ AGENCY
  // ===============================
  const agency = await prisma.propertyAgency.create({
    data: {
      name: 'MyImmo Premium',
      description:
        'Agence immobilière spécialisée dans la location haut de gamme.',
      address: '10 Rue de Paris',
      phone: '+33123456789',
      agencyLogo: 'https://picsum.photos/200',
      isApprove: true,
      status: PropertyAgencyStatus.OPEN,
      acceptTerms: true,
      ownerId: propertyOwner.id,
    },
  });

  // ===============================
  // 5️⃣ PROPERTIES
  // ===============================
  await prisma.property.createMany({
    data: [
      {
        propertyAgenceId: agency.id,
        title: 'Appartement Moderne Centre Ville',
        description: 'Magnifique appartement moderne situé en plein centre.',
        galleryImages: [
          'https://picsum.photos/800/600?1',
          'https://picsum.photos/800/600?2',
        ],
        type: PropertyType.APARTMENT,
        price: 2500,
        surface: 120,
        rooms: 3,
        address: '15 Avenue des Champs',
        city: 'Paris',
        country: 'France',
        postalCode: 75008,
        sdb: 2,
      },
      {
        propertyAgenceId: agency.id,
        title: 'Studio Cosy',
        description: 'Studio idéal pour étudiant ou jeune actif.',
        galleryImages: ['https://picsum.photos/800/600?3'],
        type: PropertyType.STUDIO,
        price: 950,
        surface: 35,
        rooms: 1,
        address: '5 Rue Victor Hugo',
        city: 'Lyon',
        country: 'France',
        postalCode: 69000,
        sdb: 1,
      },
    ],
  });

  console.log('✅ Seed completed successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
