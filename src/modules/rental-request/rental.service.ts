import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { RentalDto } from './rental.dto';
import { HttpError } from '../../config/http.error';
import { NotificationType } from '_prisma/enums';
import { RentalRequest } from '_prisma/client';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async getRentalRequestByAgency(
    agencyId: string,
    page: number,
    limit: number,
  ): Promise<{
    content: RentalRequest[];
    totalDataPerPage: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rentalRequest.findMany({
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
        skip,
        take: limit,
      }),

      this.prisma.rentalRequest.count({
        where: {
          property: {
            propertyAgenceId: agencyId,
          },
        },
      }),
    ]);

    return {
      content: data,
      totalDataPerPage: limit,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
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
    return this.prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: data.propertyId },
        include: {
          propertyAgency: {
            include: {
              owner: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
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

      const existing = await tx.rentalRequest.findFirst({
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

      await tx.rentalRequest.create({
        data: {
          ...data,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: property?.propertyAgency?.owner.userId!,
          senderId: data.tenantId,
          agencyId: property?.propertyAgency?.id,
          type: NotificationType.REQUEST,
          content: 'Nouvelle demande de location',
        },
      });

      return {
        message: `Demande de location créée avec succès.`,
      };
    });
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
