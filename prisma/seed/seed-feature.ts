import { prisma } from './client';
import { Plan, FeatureCategory } from '../generated/client';

async function seed() {
  console.log('🌱 Seeding Features & Plans...');

  // ─────────────────────────────────────────
  // 1. FEATURES
  // ─────────────────────────────────────────
  const features = [
    // PROPERTIES
    { name: 'manage_properties', category: FeatureCategory.PROPERTIES },
    { name: 'publish_properties', category: FeatureCategory.PROPERTIES },

    // LEADS
    { name: 'manage_leads', category: FeatureCategory.LEADS },

    // USERS
    { name: 'manage_users', category: FeatureCategory.USERS },

    // REPORTS
    { name: 'view_reports', category: FeatureCategory.REPORTS },

    // ACCOUNTING
    { name: 'manage_accounting', category: FeatureCategory.ACCOUNTING },
  ];

  await prisma.feature.createMany({
    data: features,
    skipDuplicates: true,
  });

  // récupérer toutes les features
  const allFeatures = await prisma.feature.findMany();

  const getFeatureId = (name: string) =>
    allFeatures.find((f) => f.name === name)?.id;

  // ─────────────────────────────────────────
  // 2. PLANS + PLAN FEATURES
  // ─────────────────────────────────────────

  await prisma.$transaction(async (tx) => {
    // BASIC
    await tx.subscriptionPlan.upsert({
      where: { name: Plan.BASIC },
      update: {},
      create: {
        name: Plan.BASIC,
        commissionRate: 5,
        isActive: true,
        planFeatures: {
          create: [
            {
              featureId: getFeatureId('manage_properties')!,
              enabled: true,
              limit: 10,
            },
            {
              featureId: getFeatureId('manage_leads')!,
              enabled: true,
              limit: 20,
            },
            {
              featureId: getFeatureId('manage_users')!,
              enabled: true,
              limit: 2,
            },
          ],
        },
      },
    });

    // STANDARD
    await tx.subscriptionPlan.upsert({
      where: { name: Plan.STANDARD },
      update: {},
      create: {
        name: Plan.STANDARD,
        commissionRate: 49,
        isActive: true,
        planFeatures: {
          create: [
            {
              featureId: getFeatureId('manage_properties')!,
              enabled: true,
              limit: 100,
            },
            {
              featureId: getFeatureId('manage_leads')!,
              enabled: true,
              limit: 200,
            },
            {
              featureId: getFeatureId('manage_users')!,
              enabled: true,
              limit: 10,
            },
            {
              featureId: getFeatureId('view_reports')!,
              enabled: true,
              limit: null,
            },
          ],
        },
      },
    });

    // PREMIUM
    await tx.subscriptionPlan.upsert({
      where: { name: Plan.PREMIUM },
      update: {},
      create: {
        name: Plan.PREMIUM,
        commissionRate: 99,

        isActive: true,
        planFeatures: {
          create: allFeatures.map((f) => ({
            featureId: f.id,
            enabled: true,
            limit: null, // illimité
          })),
        },
      },
    });
  });

  console.log('✅ Seed terminé');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
