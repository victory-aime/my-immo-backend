import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '../../config/http.error';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Plan } from '../../../prisma/generated/enums';
import { Decimal } from '../../../prisma/generated/internal/prismaNamespace';
import { PlanFeatureInput, UpdatePlanInput, CreatePlanInput } from './pack.dto';

@Injectable()
export class PackService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      include: {
        planFeatures: { include: { feature: true } },
        subscriptions: true,
      },
      orderBy: { commissionRate: 'asc' },
    });
  }

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────

  async createSubscriptionPlan(data: CreatePlanInput) {
    // 1. Vérifier que le plan n'existe pas déjà
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error(`Le plan ${data.name} existe déjà.`);
    }

    // 2. Vérifier que toutes les features existent
    const featureIds = data.features.map((f) => f.featureId);
    const foundFeatures = await this.prisma.feature.findMany({
      where: { id: { in: featureIds } },
      select: { id: true },
    });

    if (foundFeatures.length !== featureIds.length) {
      const missing = featureIds.filter(
        (id) => !foundFeatures.some((f) => f.id === id),
      );

      throw new HttpError(
        `Features introuvables : ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Créer le plan + ses PlanFeatures en une seule transaction
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        commissionRate: new Decimal(data.commissionRate),
        isActive: data.isActive ?? false,
        planFeatures: {
          create: data.features.map((f) => ({
            featureId: f.featureId,
            enabled: f.enabled,
            limit: f.limit ?? null,
          })),
        },
      },
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
    });
  }

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────

  async updateSubscriptionPlan(planId: string, data: UpdatePlanInput) {
    // 1. Vérifier que le plan existe
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { planFeatures: true },
    });

    if (!existing) {
      throw new Error(`Plan introuvable : ${planId}`);
    }

    // 2. Mise à jour dans une transaction atomique
    return this.prisma.$transaction(async (tx) => {
      // 2a. Mettre à jour les champs scalaires du plan
      const updatedPlan = await tx.subscriptionPlan.update({
        where: { id: planId },
        data: {
          ...(data.commissionRate !== undefined && {
            price: new Decimal(data.commissionRate),
          }),

          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // 2b. Mettre à jour les PlanFeatures si fournies
      if (data.features && data.features.length > 0) {
        // Vérifier que toutes les features existent
        const featureIds = data.features.map((f) => f.featureId);
        const foundFeatures = await tx.feature.findMany({
          where: { id: { in: featureIds } },
          select: { id: true },
        });

        if (foundFeatures.length !== featureIds.length) {
          const missing = featureIds.filter(
            (id) => !foundFeatures.some((f) => f.id === id),
          );
          throw new Error(`Features introuvables : ${missing.join(', ')}`);
        }

        // Stratégie upsert : on ne supprime rien,
        // on met à jour ce qui existe et on crée ce qui manque
        await Promise.all(
          data.features.map((f) =>
            tx.planFeature.upsert({
              where: {
                planId_featureId: {
                  planId,
                  featureId: f.featureId,
                },
              },
              update: {
                enabled: f.enabled,
                limit: f.limit ?? null,
              },
              create: {
                planId,
                featureId: f.featureId,
                enabled: f.enabled,
                limit: f.limit ?? null,
              },
            }),
          ),
        );
      }

      // 3. Retourner le plan complet et à jour
      return tx.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          planFeatures: {
            include: { feature: true },
          },
        },
      });
    });
  }

  // ─────────────────────────────────────────
  // HELPERS (lecture)
  // ─────────────────────────────────────────

  async getPlanByName(name: Plan) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { name },
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
    });
  }
}
