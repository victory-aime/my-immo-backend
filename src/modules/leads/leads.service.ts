import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '_root/config/http.error';
import { AssignLeadDto, ConvertToTenantDto, CreateLeadDto, UpdateLeadStatusDto } from './leads.dto';
import { AgencyRole, LeadStatus, Role } from '../../../prisma/generated/enums';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────
  // CRÉER UN LEAD
  // Accessible : client connecté uniquement (role = USER)
  // ─────────────────────────────────────────────────────────────────
  async createLead(dto: CreateLeadDto, userId: string, userRole: Role) {
    try {
      // Seul un USER (client mobile) peut créer un lead
      if (userRole !== Role.USER) {
        throw new HttpError(
          'Seul un client connecté peut envoyer une demande de contact',
          HttpStatus.UNAUTHORIZED,
          'UNAUTHORIZED',
        );
      }

      // Récupérer le profil Client lié à ce userId
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        throw new HttpError('Profil client introuvable', HttpStatus.NOT_FOUND, 'CLIENT_NOT_FOUND');
      }

      // Vérifier que la propriété existe
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!property) {
        throw new HttpError('Propriété introuvable', HttpStatus.NOT_FOUND, 'PROPERTY_NOT_FOUND');
      }

      // Vérifier que le client n'a pas déjà un lead actif sur ce bien
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          clientId: client.id,
          propertyId: dto.propertyId,
          status: { not: LeadStatus.CONVERTED },
        },
      });
      if (existingLead) {
        throw new HttpError(
          'Vous avez déjà une demande de contact en cours pour ce bien',
          HttpStatus.BAD_REQUEST,
          'LEAD_ALREADY_EXISTS',
        );
      }

      return await this.prisma.lead.create({
        data: {
          propertyId: dto.propertyId,
          agencyId: property.agencyId,
          message: dto.message,
          clientId: client.id,
          status: LeadStatus.NEW,
        },
        include: {
          property: {
            select: { title: true, type: true, city: true, price: true },
          },
          client: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur createLead:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // LISTER LES LEADS D'UNE AGENCE
  // Accessible : Owner + Staff actif de l'agence
  // ─────────────────────────────────────────────────────────────────
  async getLeadsByAgency(agencyId: string, userId: string, userRole: Role) {
    try {
      await this.checkAgencyAccess(agencyId, userId, userRole);

      return await this.prisma.lead.findMany({
        where: { agencyId },
        include: {
          property: { select: { title: true, type: true, city: true } },
          client: {
            select: {
              phone: true,
              user: { select: { name: true, email: true } },
            },
          },
          assignedTo: { select: { user: { select: { name: true } } } },
          visits: { select: { scheduledAt: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getLeadsByAgency:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // LISTER MES LEADS (côté client connecté)
  // Accessible : client connecté uniquement (role = USER)
  // ─────────────────────────────────────────────────────────────────
  async getMyLeads(userId: string, userRole: Role) {
    try {
      if (userRole !== Role.USER) {
        throw new HttpError('Accès réservé aux clients', HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
      }

      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        throw new HttpError('Profil client introuvable', HttpStatus.NOT_FOUND, 'CLIENT_NOT_FOUND');
      }

      return await this.prisma.lead.findMany({
        where: { clientId: client.id },
        include: {
          property: {
            select: { title: true, type: true, city: true, price: true },
          },
          assignedTo: { select: { user: { select: { name: true } } } },
          visits: { select: { scheduledAt: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getMyLeads:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // DÉTAIL D'UN LEAD
  // Accessible : Owner + Staff de l'agence
  // ─────────────────────────────────────────────────────────────────
  async getLeadById(leadId: string, userId: string, userRole: Role) {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          property: true,
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
          assignedTo: {
            include: { user: { select: { name: true, email: true } } },
          },
          visits: true,
          tenant: true,
        },
      });

      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      await this.checkAgencyAccess(lead.agencyId, userId, userRole);

      return lead;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getLeadById:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CHANGER LE STATUT D'UN LEAD (pipeline CRM)
  // Accessible : Owner + Staff actif de l'agence
  // ─────────────────────────────────────────────────────────────────
  async updateLeadStatus(leadId: string, dto: UpdateLeadStatusDto, userId: string, userRole: Role) {
    try {
      const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      await this.checkAgencyAccess(lead.agencyId, userId, userRole);

      if (lead.status === LeadStatus.CONVERTED) {
        throw new HttpError(
          'Impossible de modifier un lead déjà converti en locataire',
          HttpStatus.BAD_REQUEST,
          'LEAD_ALREADY_CONVERTED',
        );
      }

      if (dto.status === LeadStatus.CONVERTED) {
        throw new HttpError(
          'Pour convertir un lead, utilisez le endpoint /convert-tenant',
          HttpStatus.BAD_REQUEST,
          'USE_CONVERT_ENDPOINT',
        );
      }

      return await this.prisma.lead.update({
        where: { id: leadId },
        data: { status: dto.status },
        include: {
          property: { select: { title: true } },
          assignedTo: { select: { user: { select: { name: true } } } },
        },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur updateLeadStatus:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ASSIGNER UN AGENT AU LEAD
  // Accessible : Owner + AGENCY_ADMIN uniquement
  // ─────────────────────────────────────────────────────────────────
  async assignLead(leadId: string, dto: AssignLeadDto, userId: string, userRole: Role) {
    try {
      const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      await this.checkAgencyAccess(lead.agencyId, userId, userRole);
      await this.checkAdminAccess(lead.agencyId, userId, userRole);

      const staff = await this.prisma.staff.findFirst({
        where: { id: dto.staffId, agencyId: lead.agencyId, isActive: true },
      });
      if (!staff) {
        throw new HttpError(
          "Cet agent n'appartient pas à votre agence ou est inactif",
          HttpStatus.BAD_REQUEST,
          'STAFF_NOT_FOUND',
        );
      }

      return await this.prisma.lead.update({
        where: { id: leadId },
        data: { assignedToId: dto.staffId },
        include: {
          assignedTo: {
            select: { user: { select: { name: true, email: true } } },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur assignLead:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SUPPRIMER UN LEAD
  // Accessible : Owner + AGENCY_ADMIN uniquement
  // ─────────────────────────────────────────────────────────────────
  async deleteLead(leadId: string, userId: string, userRole: Role) {
    try {
      const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      await this.checkAgencyAccess(lead.agencyId, userId, userRole);
      await this.checkAdminAccess(lead.agencyId, userId, userRole);

      return await this.prisma.lead.delete({ where: { id: leadId } });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur deleteLead:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CONVERTIR UN LEAD EN LOCATAIRE
  // Accessible : Owner + AGENCY_ADMIN uniquement
  // ─────────────────────────────────────────────────────────────────
  async convertToTenant(leadId: string, dto: ConvertToTenantDto, userId: string, userRole: Role) {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { tenant: true },
      });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      await this.checkAgencyAccess(lead.agencyId, userId, userRole);
      await this.checkAdminAccess(lead.agencyId, userId, userRole);

      if (lead.tenant) {
        throw new HttpError(
          'Ce lead a déjà été converti en locataire',
          HttpStatus.BAD_REQUEST,
          'LEAD_ALREADY_CONVERTED',
        );
      }

      // Transaction : les deux réussissent ensemble ou échouent ensemble
      return await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            documents: dto.documents ?? [],
            leadId: leadId,
            propertyId: lead.propertyId,
            agencyId: lead.agencyId,
          },
        });

        await tx.lead.update({
          where: { id: leadId },
          data: { status: LeadStatus.CONVERTED },
        });

        return tenant;
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur convertToTenant:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // MÉTHODES PRIVÉES UTILITAIRES
  // ─────────────────────────────────────────────────────────────────

  // Vérifie que l'utilisateur appartient à l'agence (Owner ou Staff actif)
  private async checkAgencyAccess(agencyId: string, userId: string, userRole: Role) {
    if (userRole === Role.SUPER_ADMIN) return;

    if (userRole === Role.OWNER) {
      // ✅ FIX : trouver l'Owner par userId, puis vérifier que son agence correspond
      const owner = await this.prisma.owner.findUnique({
        where: { userId },
        include: { agency: true },
      });
      if (!owner || owner.agency?.id !== agencyId) {
        throw new HttpError(
          'Accès refusé à cette agence',
          HttpStatus.FORBIDDEN,
          'AGENCY_ACCESS_DENIED',
        );
      }
      return;
    }

    const staff = await this.prisma.staff.findFirst({
      where: { userId, agencyId, isActive: true },
    });
    if (!staff) {
      throw new HttpError(
        'Accès refusé à cette agence',
        HttpStatus.FORBIDDEN,
        'AGENCY_ACCESS_DENIED',
      );
    }
  }

  // Vérifie que l'utilisateur est Owner ou AGENCY_ADMIN
  private async checkAdminAccess(agencyId: string, userId: string, userRole: Role) {
    if (userRole === Role.OWNER || userRole === Role.SUPER_ADMIN) return;

    const staff = await this.prisma.staff.findFirst({
      where: { userId, agencyId, isActive: true, agencyRole: AgencyRole.AGENCY_ADMIN },
    });
    if (!staff) {
      throw new HttpError(
        'Seul un Owner ou Admin agence peut effectuer cette action',
        HttpStatus.FORBIDDEN,
        'ADMIN_ACCESS_REQUIRED',
      );
    }
  }
}
