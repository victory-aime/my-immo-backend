import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { RentalDto } from './rental.dto';
import { HttpError } from '../../config/http.error';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async getRentalRequestByAgency(agencyId: string) {
    return this.prisma.rentalRequest.findMany({
      where: {
        property: {
          propertyAgenceId: agencyId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
          },
        },
        tenant: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRentalRequestByUser(userId: string) {
    return this.prisma.rentalRequest.findMany({
      where: {
        tenantId: userId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            propertyAgency: {
              select: {
                id: true,
                name: true,
                agencyLogo: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createRentalRequest(data: RentalDto): Promise<{ message: string }> {
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new HttpError(
        'Propriété introuvable',
        HttpStatus.NOT_FOUND,
        'PROPERTY_NOT_FOUND',
      );
    }

    if (property.status !== 'AVAILABLE') {
      throw new HttpError(
        'Cette propriété n’est pas disponible',
        HttpStatus.BAD_REQUEST,
        'PROPERTY_NOT_AVAILABLE',
      );
    }

    const existing = await this.prisma.rentalRequest.findFirst({
      where: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
      },
    });

    if (existing) {
      throw new HttpError(
        'Vous avez déjà envoyé une demande pour cette propriété',
        HttpStatus.CONFLICT,
        'RENTAL_REQUEST_ALREADY_EXISTS',
      );
    }

    await this.prisma.rentalRequest.create({
      data: {
        ...data,
      },
    });

    return {
      message: `Demande de location créée avec succès.`,
    };
  }

  async updateRentalRequest(
    requestId: string,
    agencyId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const request = await this.prisma.rentalRequest.findUnique({
      where: { id: requestId },
      include: {
        property: true,
      },
    });

    if (!request) {
      throw new HttpError(
        'Demande de location introuvable',
        HttpStatus.NOT_FOUND,
        'RENTAL_REQUEST_NOT_FOUND',
      );
    }

    if (request.property.propertyAgenceId !== agencyId) {
      throw new HttpError(
        'Accès non autorisé à cette demande',
        HttpStatus.FORBIDDEN,
        'UNAUTHORIZED_RENTAL_ACCESS',
      );
    }

    return this.prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }
}
