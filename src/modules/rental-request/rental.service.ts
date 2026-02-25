import { Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { RentalDto } from './rental.dto';

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

  async createRentalRequest(data: RentalDto) {
    // Vérifier propriété
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    if (property.status !== 'AVAILABLE') {
      throw new Error('Property not available');
    }

    // Vérifier doublon
    const existing = await this.prisma.rentalRequest.findFirst({
      where: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
      },
    });

    if (existing) {
      throw new Error('Rental request already exists');
    }

    return this.prisma.rentalRequest.create({
      data: {
        ...data,
      },
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
      throw new Error('Rental request not found');
    }

    // Vérifier que la demande appartient bien à l’agence
    if (request.property.propertyAgenceId !== agencyId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }
}
