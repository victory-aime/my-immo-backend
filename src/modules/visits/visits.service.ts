import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { AssignAgentDto, CreateVisitDto, UpdateVisitStatusDto } from './visits.dto';
import { VisitStatus } from '../../../prisma/generated/enums';
import { HttpError } from '_root/config/http.error';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  // CRÉER UNE VISITE
  async createVisit(dto: CreateVisitDto, agencyId: string) {
    try {
      // 1. Vérifier que le lead existe
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.leadId },
        include: { client: { include: { user: true } } },
      });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      // 2. Vérifier que le bien existe
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!property) {
        throw new HttpError('Bien introuvable', HttpStatus.NOT_FOUND, 'PROPERTY_NOT_FOUND');
      }

      // 3. Vérifier que l'agent existe si fourni
      if (dto.agentId) {
        const agent = await this.prisma.staff.findFirst({
          where: { id: dto.agentId, agencyId, isActive: true },
        });
        if (!agent) {
          throw new HttpError('Agent introuvable', HttpStatus.NOT_FOUND, 'AGENT_NOT_FOUND');
        }
      }

      // 4. Créer la visite
      await this.prisma.visit.create({
        data: {
          scheduledAt: new Date(dto.scheduledAt),
          notes: dto.notes,
          leadId: dto.leadId,
          propertyId: dto.propertyId,
          agentId: dto.agentId ?? null,
          agencyId,
          status: VisitStatus.PLANNED,
        },
      });

      // 🔔 TODO : notifier le client une fois le module notifications prêt

      return { message: 'Visite planifiée avec succès' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur createVisit:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // LISTER LES VISITES D'UNE AGENCE
  async getVisitsByAgency(agencyId: string) {
    try {
      const visits = await this.prisma.visit.findMany({
        where: { agencyId },
        include: {
          property: { select: { title: true, address: true, city: true } },
          agent: { select: { user: { select: { name: true, email: true } } } },
          lead: {
            include: {
              client: { include: { user: { select: { name: true, email: true } } } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      //  Vérifier si l'agence a des visites
      if (visits.length === 0) {
        return { message: 'Aucune visite trouvée pour cette agence.' };
      }

      return visits;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getVisitsByAgency:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // DÉTAIL D'UNE VISITE
  async getVisitById(visitId: string) {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          property: { select: { title: true, address: true, city: true } },
          agent: { select: { user: { select: { name: true, email: true } } } },
          lead: {
            include: {
              client: { include: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      });

      if (!visit) {
        throw new HttpError('Visite introuvable', HttpStatus.NOT_FOUND, 'VISIT_NOT_FOUND');
      }

      return visit;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getVisitById:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // MES VISITES (CLIENT)
  async getMyVisits(userId: string) {
    try {
      const client = await this.prisma.client.findUnique({ where: { userId } });
      if (!client) {
        throw new HttpError('Client introuvable', HttpStatus.NOT_FOUND, 'CLIENT_NOT_FOUND');
      }

      const visits = await this.prisma.visit.findMany({
        where: { lead: { clientId: client.id } },
        include: {
          property: { select: { title: true, address: true, city: true } },
          agent: { select: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      //  Vérifier si le client a des visites
      if (visits.length === 0) {
        return { message: "Vous n'avez aucune visite planifiée pour le moment." };
      }

      return visits;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getMyVisits:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // MES VISITES (CLIENT)
  async updateVisitStatus(visitId: string, dto: UpdateVisitStatusDto) {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { id: visitId },
        include: {
          lead: { include: { client: { include: { user: true } } } },
          property: { select: { title: true } },
        },
      });

      if (!visit) {
        throw new HttpError('Visite introuvable', HttpStatus.NOT_FOUND, 'VISIT_NOT_FOUND');
      }

      if (visit.status === dto.status) {
        return { message: 'La visite a déjà ce statut.' };
      }

      await this.prisma.visit.update({
        where: { id: visitId },
        data: { status: dto.status },
      });

      // 🔔 TODO : notifier le client du changement de statut une fois le module notifications prêt

      return { message: 'Statut mis à jour avec succès' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur updateVisitStatus:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
  // ASSIGNER UN AGENT À UNE VISITE
  async assignAgent(visitId: string, dto: AssignAgentDto) {
    try {
      const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
      if (!visit) {
        throw new HttpError('Visite introuvable', HttpStatus.NOT_FOUND, 'VISIT_NOT_FOUND');
      }

      //  Vérifier si l'agent est déjà assigné à cette visite
      if (visit.agentId === dto.agentId) {
        return { message: 'Cet agent est déjà assigné à cette visite.' };
      }

      const agent = await this.prisma.staff.findFirst({
        where: { id: dto.agentId, agencyId: visit.agencyId, isActive: true },
        include: { user: true },
      });
      if (!agent) {
        throw new HttpError('Agent introuvable', HttpStatus.NOT_FOUND, 'AGENT_NOT_FOUND');
      }

      await this.prisma.visit.update({
        where: { id: visitId },
        data: { agentId: dto.agentId },
      });

      // 🔔 TODO : notifier l'agent une fois le module notifications prêt

      return { message: 'Agent assigné avec succès' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur assignAgent:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  // SUPPRIMER UNE VISITE
  async deleteVisit(visitId: string) {
    try {
      const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
      if (!visit) {
        throw new HttpError('Visite introuvable', HttpStatus.NOT_FOUND, 'VISIT_NOT_FOUND');
      }

      if (visit.status === VisitStatus.DONE) {
        throw new HttpError(
          'Impossible de supprimer une visite déjà effectuée',
          HttpStatus.BAD_REQUEST,
          'VISIT_ALREADY_DONE',
        );
      }

      await this.prisma.visit.delete({ where: { id: visitId } });

      return { message: 'Visite supprimée avec succès' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur deleteVisit:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }
}
