import { prisma } from './client';
import { Plan, FeatureCategory } from '../generated/client';

async function seed() {
  console.log('🌱 Seeding Features, Permissions & Plans...');

  // ─────────────────────────────────────────
  // 1. FEATURES + PERMISSIONS
  // ─────────────────────────────────────────

  const featuresWithPermissions = [
    {
      name: 'manage_properties',
      category: FeatureCategory.PROPERTIES,
      permissions: [
        {
          name: 'view_properties',
          description: 'Voir la liste des propriétés',
        },
        {
          name: 'create_property',
          description: 'Créer une nouvelle propriété',
        },
        {
          name: 'update_property',
          description: 'Modifier une propriété existante',
        },
        { name: 'delete_property', description: 'Supprimer une propriété' },
      ],
    },
    {
      name: 'publish_properties',
      category: FeatureCategory.ANNONCES,
      permissions: [
        { name: 'publish_property', description: 'Publier une propriété' },
        { name: 'publish_land', description: 'Publier un terrain' },
        { name: 'unpublish_property', description: 'Dépublier une propriété' },
      ],
    },
    {
      name: 'manage_leads',
      category: FeatureCategory.LEADS,
      permissions: [
        { name: 'view_leads', description: 'Voir la liste des leads' },
        { name: 'create_lead', description: 'Créer un nouveau lead' },
        { name: 'update_lead', description: 'Modifier un lead existant' },
        { name: 'delete_lead', description: 'Supprimer un lead' },
        {
          name: 'assign_lead',
          description: 'Assigner un lead à un collaborateur',
        },
      ],
    },
    {
      name: 'manage_users',
      category: FeatureCategory.USERS,
      permissions: [
        { name: 'view_users', description: 'Voir la liste des collaborateurs' },
        {
          name: 'invite_users',
          description: 'Inviter un nouveau collaborateur',
        },
        {
          name: 'update_users',
          description: "Modifier les informations d'un collaborateur",
        },
        { name: 'delete_users', description: 'Supprimer un collaborateur' },
      ],
    },
    {
      name: 'view_reports',
      category: FeatureCategory.REPORTS,
      permissions: [
        { name: 'view_reports', description: 'Consulter les rapports' },
        { name: 'export_reports', description: 'Exporter les rapports' },
      ],
    },
    {
      name: 'manage_accounting',
      category: FeatureCategory.ACCOUNTING,
      permissions: [
        { name: 'view_accounting', description: 'Voir les données comptables' },
        { name: 'create_transaction', description: 'Créer une transaction' },
        { name: 'update_transaction', description: 'Modifier une transaction' },
        {
          name: 'delete_transaction',
          description: 'Supprimer une transaction',
        },
      ],
    },
  ];

  // Upsert chaque feature puis ses permissions
  for (const { permissions, ...featureData } of featuresWithPermissions) {
    const feature = await prisma.feature.upsert({
      where: { name: featureData.name },
      update: {},
      create: { ...featureData },
    });

    await prisma.permission.createMany({
      data: permissions.map((p) => ({
        ...p,
        featureId: feature.id,
      })),
      skipDuplicates: true,
    });
  }

  console.log('✅ Features & Permissions créées');

  // ─────────────────────────────────────────
  // 2. PLANS + PLAN FEATURES
  // ─────────────────────────────────────────

  const allFeatures = await prisma.feature.findMany();

  const getFeatureId = (name: string) => allFeatures.find((f) => f.name === name)?.id!;

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
              featureId: getFeatureId('manage_properties'),
              enabled: true,
              limit: 10,
            },
            {
              featureId: getFeatureId('manage_leads'),
              enabled: true,
              limit: 20,
            },
            {
              featureId: getFeatureId('manage_users'),
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
              featureId: getFeatureId('manage_properties'),
              enabled: true,
              limit: 100,
            },
            {
              featureId: getFeatureId('publish_properties'),
              enabled: true,
              limit: null,
            },
            {
              featureId: getFeatureId('manage_leads'),
              enabled: true,
              limit: 200,
            },
            {
              featureId: getFeatureId('manage_users'),
              enabled: true,
              limit: 10,
            },
            {
              featureId: getFeatureId('view_reports'),
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
            limit: null,
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
