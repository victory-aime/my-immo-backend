import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { createAgencyOwnerDto, updateAgencyDto } from './agency.dto';
import { AgencyStatus,BillingCycle, Plan,PricingType, Role, SubscriptionStatus } from '../../../prisma/generated/enums';
import { UsersService } from '_root/modules/users/users.service';
import { HttpError } from '_root/config/http.error';
import { getAuthInstance } from '_root/lib/auth';
import { Decimal } from '@prisma/client/runtime/index-browser';
import { Subscription } from '../../../prisma/generated/client';

@Injectable()
export class AgencyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  // ─────────────────────────────────────────
  // HELPERS PRIVÉS
  // ─────────────────────────────────────────

  async findAgency(agencyId: string) {
    if (!agencyId) {
      throw new HttpError(
        'Certains informations sont manquantes',
        HttpStatus.BAD_REQUEST,
        'BAD_REQUEST',
      );
    }
    const agency = await this.prismaService.agency.findUnique({
      where: { id: agencyId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }
    return agency;
  }

  async getAgencyPlanFeatures(agencyId: string) {
    const subscription = await this.prismaService.subscription.findUnique({
      where: { agencyId },
      include: {
        plan: {
          include: {
            planFeatures: {
              where: { enabled: true },
              include: {
                feature: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return {
        features: [],
      };
    }

    const features = subscription.plan.planFeatures.map((pf) => ({
      id: pf.feature.id,
      name: pf.feature.name,
      category: pf.feature.category,
      limit: pf.limit,
    }));

    return {
      plan: subscription.plan.name,
      features,
    };
  }

  // Récupère le plan actif en base, lève une erreur explicite s'il est absent
  private async resolveActivePlan(planId: string) {
    const plan = await this.prismaService.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        pricings: true,
      },
    });
    if (!plan) {
      return this.prismaService.subscriptionPlan.findUnique({
        where: { name: 'BASIC_COMMISSION' },
        include: {
          pricings: true,
        },
      });
    }
    if (!plan.isActive) {
      throw new HttpError(
        `Le plan ${plan.name} n'est pas disponible actuellement.`,
        HttpStatus.BAD_REQUEST,
        'PLAN_INACTIVE',
      );
    }
    return plan;
  }

  // ─────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────

  async createAgency(data: createAgencyOwnerDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.userService.findUser({
        email: data?.userEmail,
      });
      if (existingUser) {
        throw new BadRequestException('Impossible de créer un compte avec cet email');
      }

      const { user } = await getAuthInstance().api.signUpEmail({
        body: {
          name: data?.username,
          email: data?.userEmail,
          password: data?.password,
        },
      });

      const plan = await this.resolveActivePlan(data.plan?.planId);
      const isCommission = plan?.pricingType === PricingType.COMMISSION;
      const isSubscription = plan?.pricingType === PricingType.SUBSCRIPTION;

      // ─────────────────────────────────────────
      // 4. SUBSCRIPTION PRICING (IF NEEDED)
      // ─────────────────────────────────────────
      let selectedPricing:
        | {
            id: string;
            createdAt: Date;
            planId: string;
            billingCycle: BillingCycle;
            price: Decimal;
            currency: string;
            discountPercentage: Decimal | null;
          }
        | undefined = undefined;

      if (isSubscription) {
        selectedPricing = plan?.pricings?.find(
          (p) => p.billingCycle === (data?.plan?.billingCycle ?? BillingCycle.MONTHLY),
        );

        if (!selectedPricing) {
          throw new BadRequestException('Cycle de facturation invalide pour ce plan');
        }
      }

      // ─────────────────────────────────────────
      // 5. TRANSACTION ATOMIQUE
      // ─────────────────────────────────────────
      await this.prismaService.$transaction(async (tx) => {
        // 5a. OWNER
        const owner = await tx.owner.create({
          data: { userId: user.id },
        });

        // 5b. ROLE UPDATE
        await tx.user.update({
          where: { id: user.id },
          data: { role: Role.OWNER },
        });

        // 5c. AGENCY
        const agency = await tx.agency.create({
          data: {
            name: data.name,
            email: data.email,
            ownerId: owner.id,
            address: data.address,
            phone: data.phone,
            documents: data.documents ?? [],
            acceptTerms: data.acceptTerms,
          },
        });

        // ─────────────────────────────────────────
        // 5d. SUBSCRIPTION DATA
        // ─────────────────────────────────────────
        const subscriptionData: Subscription | any = {
          agencyId: agency.id,
          planId: plan?.id!,
          pricingType: plan?.pricingType!,
        };

        // ─────────────────────────────────────────
        // COMMISSION PLAN LOGIC
        // ─────────────────────────────────────────
        if (isCommission) {
          subscriptionData.commissionRate = plan.commissionRate;
        }

        // ─────────────────────────────────────────
        // SUBSCRIPTION PLAN LOGIC
        // ─────────────────────────────────────────
        if (isSubscription) {
          const now = new Date();
          const billingCycle = selectedPricing?.billingCycle;
          const endDate = new Date(now);

          if (billingCycle === BillingCycle.MONTHLY) {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          if (billingCycle === BillingCycle.YEARLY) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }

          subscriptionData.billingCycle = billingCycle!;
          subscriptionData.price = selectedPricing?.price!;
          subscriptionData.currency = selectedPricing?.currency!;
          subscriptionData.currentPeriodStart = now;
          subscriptionData.currentPeriodEnd = endDate;
        }

        // ─────────────────────────────────────────
        // 5e. CREATE SUBSCRIPTION
        // ─────────────────────────────────────────
        await tx.subscription.create({
          data: subscriptionData,
        });
      });

      // ─────────────────────────────────────────
      // SUCCESS RESPONSE
      // ─────────────────────────────────────────
      return {
        message: 'Votre agence a été créée avec succès et est en attente de validation.',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof HttpError
      ) {
        throw new HttpError('Une erreur est survenue, veuillez réessayer plus tard');
      }
      console.error('Erreur onboarding agence:', error);
      await this.prismaService.user.delete({
        where: { email: data.userEmail },
      });
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────
  // MISE À JOUR
  // ─────────────────────────────────────────

  async updateAgency(data: updateAgencyDto): Promise<{ message: string }> {
    try {
      const agency = await this.findAgency(data.agencyId);
      await this.prismaService.agency.update({
        where: { id: agency.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          ...(data.address && { address: data.address }),
          ...(data.phone && { phone: data.phone }),
          ...(data.agencyLogo && { agencyLogo: data.agencyLogo }),
        },
      });
      return { message: 'Informations mises à jour.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof HttpError) {
        throw error;
      }
      console.error('Erreur updateAgency:', error);
      throw new InternalServerErrorException('Une erreur est survenue, réessayez plus tard.');
    }
  }

  // ─────────────────────────────────────────
  // CHANGEMENT DE PLAN
  // ─────────────────────────────────────────

  async changePlan(agencyId: string, newPlan: Plan): Promise<{ message: string }> {
    try {
      await this.findAgency(agencyId);
      const plan = await this.resolveActivePlan(newPlan);

      // @@unique([agencyId]) sur Subscription → on update directement
      await this.prismaService.subscription.update({
        where: { agencyId },
        data: {
          planId: plan?.id,
          updatedAt: new Date(),
        },
      });

      return { message: `Passage au plan ${newPlan} effectué avec succès.` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof HttpError) {
        throw error;
      }
      console.error('Erreur changePlan:', error);
      throw new InternalServerErrorException('Une erreur est survenue, réessayez plus tard.');
    }
  }

  // ─────────────────────────────────────────
  // FERMETURE
  // ─────────────────────────────────────────

  async closeAgency(data: { agencyId: string; ownerId: string }) {
    const agency = await this.findAgency(data.agencyId);

    const owner = await this.prismaService.owner.findUnique({
      where: { id: data.ownerId },
    });
    if (!owner) {
      throw new BadRequestException('Owner introuvable.');
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.agency.update({
        where: { id: agency.id },
        data: { status: AgencyStatus.CLOSE },
      });
      await tx.user.update({
        where: { id: owner.userId },
        data: { role: Role.USER },
      });
      // Annuler l'abonnement actif
      await tx.subscription.update({
        where: { agencyId: agency.id },
        data: { status: SubscriptionStatus.INACTIVE },
      });
    });
  }

  // ─────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────

  async checkAgencyName(name: string): Promise<boolean> {
    const agency = await this.prismaService.agency.findUnique({
      where: { name },
    });
    return !agency;
  }

  async checkAgencyOwnership(agencyId: string) {
    const agency = await this.findAgency(agencyId);
    return agency.id;
  }
}
