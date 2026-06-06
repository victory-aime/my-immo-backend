import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { AgencyStatus } from '../../../prisma/generated/enums';

@Injectable()
export class AgencyAdminService {
  constructor(private readonly prismaService: PrismaService) {}

  // ─────────────────────────────────────────
  // 1. Liste de toutes les agences + owners
  // ─────────────────────────────────────────
  async getAllAgencies() {
    try {
      return await this.prismaService.agency.findMany({
        include: {
          owner: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
          subscriptions: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la récupération des agences.',
      );
    }
  }

  // ─────────────────────────────────────────
  // 2. Détail complet d'une agence par ID
  // ─────────────────────────────────────────
  async getAgencyById(agencyId: string) {
    const agency = await this.prismaService.agency.findUnique({
      where: { id: agencyId },
      include: {
        // ── Propriétaire ──
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        // ── Équipe ──
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        // ── Abonnement ──
        subscriptions: {
          include: {
            plan: true,
          },
        },
        // ── Propriétés & Immobilier ──
        properties: true,
        batiment: true,
        villas: true,
        lands: true,
        // ── Activité commerciale ──
        leads: true,
        visits: true,
        tenants: true,
        contracts: true,
        // ── Finance ──
        transactions: true,
        transactionCommission: true,
        // ── Support & Admin ──
        tickets: true,
        reports: true,
        invitations: true,
      },
    });

    if (!agency) {
      throw new NotFoundException(`Agence avec l'ID ${agencyId} introuvable`);
    }

    return agency;
  }
  // ─────────────────────────────────────────
  // 3. Changer le statut d'une agence
  // ─────────────────────────────────────────
  async updateAgencyStatus(agencyId: string, status: AgencyStatus) {
    const agency = await this.prismaService.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException(`Agence avec l'ID ${agencyId} introuvable`);
    }

    try {
      return await this.prismaService.agency.update({
        where: { id: agencyId },
        data: { status },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la mise à jour du statut.',
      );
    }
  }
}
