import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { AssignAgentDto, CreateVisitDto, UpdateVisitStatusDto } from './visits.dto';
import { NotificationType, VisitStatus } from '../../../prisma/generated/enums';
import { HttpError } from '_root/config/http.error';
import { Notifications2Service } from '_root/modules/notifications2/notifications2.service';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: Notifications2Service, // ✅ injecté
  ) {}

  // CREER UNE VISITE
  async createVisit(dto: CreateVisitDto, agencyId: string) {
    try {
      // 1. Verifier que le lead existe
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.leadId },
        include: { client: { include: { user: true } } },
      });
      if (!lead) {
        throw new HttpError('Lead introuvable', HttpStatus.NOT_FOUND, 'LEAD_NOT_FOUND');
      }

      // 2. Verifier que le bien existe
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!property) {
        throw new HttpError('Bien introuvable', HttpStatus.NOT_FOUND, 'PROPERTY_NOT_FOUND');
      }

      // 3. Verifier que l'agent existe si fourni
      if (dto.agentId) {
        const agent = await this.prisma.staff.findFirst({
          where: { id: dto.agentId, agencyId, isActive: true },
        });
        if (!agent) {
          throw new HttpError('Agent introuvable', HttpStatus.NOT_FOUND, 'AGENT_NOT_FOUND');
        }
      }

      // 4. Creer la visite
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

      // 🔔 Notifier le client que sa visite a ete planifiee
      const clientUserId = lead.client?.user?.id;
      if (clientUserId) {
        await this.notificationsService.sendNotification({
          type: NotificationType.VISIT,
          recipientId: clientUserId,
          title: 'Visite planifiee',
          content: `Votre visite pour le bien "${property.title}" a ete planifiee le ${new Date(dto.scheduledAt).toLocaleDateString('fr-FR')}.`,
          agencyId,
        });
      }

      return { message: 'Visite planifiee avec succes' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur createVisit:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
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

      if (visits.length === 0) {
        return { message: 'Aucune visite trouvee pour cette agence.' };
      }

      return visits;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getVisitsByAgency:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
      );
    }
  }

  // DETAIL D'UNE VISITE
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
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
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

      if (visits.length === 0) {
        return { message: "Vous n'avez aucune visite planifiee pour le moment." };
      }

      return visits;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur getMyVisits:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
      );
    }
  }

  // METTRE A JOUR LE STATUT D'UNE VISITE
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
        return { message: 'La visite a deja ce statut.' };
      }

      await this.prisma.visit.update({
        where: { id: visitId },
        data: { status: dto.status },
      });

      // 🔔 Notifier le client du changement de statut
      const clientUserId = visit.lead?.client?.user?.id;
      if (clientUserId) {
        const statusLabels: Record<VisitStatus, string> = {
          [VisitStatus.PLANNED]: 'planifiee',
          [VisitStatus.CONFIRMED]: 'confirmee',
          [VisitStatus.DONE]: 'effectuee',
          [VisitStatus.CANCELLED]: 'annulee',
        };

        await this.notificationsService.sendNotification({
          type: NotificationType.VISIT,
          recipientId: clientUserId,
          title: 'Mise a jour de votre visite',
          content: `Votre visite pour le bien "${visit.property?.title}" est desormais ${statusLabels[dto.status]}.`,
          agencyId: visit.agencyId,
        });
      }

      return { message: 'Statut mis a jour avec succes' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur updateVisitStatus:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
      );
    }
  }

  // ASSIGNER UN AGENT A UNE VISITE
  async assignAgent(visitId: string, dto: AssignAgentDto) {
    try {
      const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
      if (!visit) {
        throw new HttpError('Visite introuvable', HttpStatus.NOT_FOUND, 'VISIT_NOT_FOUND');
      }

      if (visit.agentId === dto.agentId) {
        return { message: 'Cet agent est deja assigne a cette visite.' };
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

      // 🔔 Notifier l'agent qu'une visite lui a ete assignee
      await this.notificationsService.sendNotification({
        type: NotificationType.VISIT,
        recipientId: agent.user.id,
        title: 'Nouvelle visite assignee',
        content: `Une visite vous a ete assignee le ${new Date(visit.scheduledAt).toLocaleDateString('fr-FR')}.`,
        agencyId: visit.agencyId,
      });

      return { message: 'Agent assigne avec succes' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur assignAgent:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
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
          'Impossible de supprimer une visite deja effectuee',
          HttpStatus.BAD_REQUEST,
          'VISIT_ALREADY_DONE',
        );
      }

      await this.prisma.visit.delete({ where: { id: visitId } });

      return { message: 'Visite supprimee avec succes' };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur deleteVisit:', error);
      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez reessayer plus tard.',
      );
    }
  }
}
