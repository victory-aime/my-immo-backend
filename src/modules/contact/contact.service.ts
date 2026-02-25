import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '_root/config/http.error';
import { ContactStatus } from '_prisma/enums';
import { CreateContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto): Promise<{ message: string }> {
    const { fullName, email, phone, subject, message, propertyId, userId } =
      dto;

    // 1️⃣ Vérifier que la propriété existe
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { propertyAgency: true },
    });

    if (!property) {
      throw new HttpError(
        'Propriété introuvable.',
        HttpStatus.NOT_FOUND,
        'PROPERTY_NOT_FOUND',
      );
    }

    if (!property.propertyAgency) {
      throw new HttpError(
        'Agence liée à la propriété introuvable.',
        HttpStatus.BAD_REQUEST,
        'AGENCY_NOT_FOUND',
      );
    }

    // 2️⃣ Vérifier doublon intelligent
    if (userId) {
      const existingByUser = await this.prisma.publicContact.findFirst({
        where: {
          propertyId,
          userId,
        },
      });

      if (existingByUser) {
        throw new HttpError(
          'Vous avez déjà contacté le propriétaire pour ce bien.',
          HttpStatus.CONFLICT,
          'CONTACT_ALREADY_EXISTS',
        );
      }
    } else {
      const existingByEmail = await this.prisma.publicContact.findUnique({
        where: {
          email_propertyId: {
            email,
            propertyId,
          },
        },
      });

      if (existingByEmail) {
        throw new HttpError(
          'Vous avez déjà contacté le propriétaire pour ce bien',
          HttpStatus.CONFLICT,
          'CONTACT_ALREADY_EXISTS',
        );
      }
    }

    // 3️⃣ Création
    await this.prisma.publicContact.create({
      data: {
        fullName,
        email,
        phone,
        subject,
        message,
        propertyId,
        agencyId: property.propertyAgency.id,
        userId,
        status: ContactStatus.PENDING,
      },
    });

    return {
      message:
        'Votre message a été envoyé avec succès. Le propriétaire vous répondra prochainement.',
    };
  }

  // 🔎 Récupérer les demandes d’une agence (dashboard propriétaire)
  async getAgencyRequest(agencyId: string) {
    return this.prisma.publicContact.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            title: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateStatus(
    contactId: string,
    status: ContactStatus,
  ): Promise<{ message: string }> {
    const contact = await this.prisma.publicContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new HttpError(
        'Demande introuvable.',
        HttpStatus.NOT_FOUND,
        'CONTACT_NOT_FOUND',
      );
    }

    await this.prisma.publicContact.update({
      where: { id: contactId },
      data: { status: 'READ' },
    });

    return { message: 'Statut mis à jour avec succès.' };
  }

  async markAllAsRead(agencyId: string): Promise<{ message: string }> {
    const result = await this.prisma.publicContact.updateMany({
      where: {
        agencyId,
        status: ContactStatus.PENDING,
      },
      data: {
        status: ContactStatus.READ,
      },
    });

    return {
      message: `Toutes les demandes ont été marquées comme lues ${result.count}.`,
    };
  }
}
