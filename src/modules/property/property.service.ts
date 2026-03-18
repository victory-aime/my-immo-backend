import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { propertyDto } from '_root/modules/property/property.dto';
import { HttpError } from '_root/config/http.error';
import { AgencyService } from '_root/modules/agency/agency.service';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyService: AgencyService,
  ) {}

  async getAllPropertyByAgency(
    ownerId: string,
    agencyId: string,
    page?: number,
    limit?: number,
  ) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);

    const pageInitial = page || 1;
    const limitPage = limit || 10;

    const skip = (pageInitial - 1) * limitPage;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where: {
          propertyAgenceId: agencyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitPage,
      }),

      this.prisma.property.count({
        where: {
          propertyAgenceId: agencyId,
        },
      }),
    ]);

    return {
      content: data,
      totalDataPerPage: limitPage,
      totalItems: total,
      currentPage: pageInitial,
      totalPages: Math.ceil(total / limitPage),
    };
  }

  async getAllPublicProperties() {
    return this.prisma.property.findMany({
      where: {
        status: 'AVAILABLE',
      },
      include: {
        propertyAgency: {
          select: {
            name: true,
            phone: true,
            isApprove: true,
          },
        },
      },
    });
  }

  async createProperty(
    ownerId: string,
    data: propertyDto,
  ): Promise<{ message: string }> {
    await this.agencyService.checkAgencyOwnership(
      ownerId,
      data.propertyAgenceId,
    );

    const uniqueName = await this.prisma.property.findUnique({
      where: {
        propertyAgenceId_title: {
          propertyAgenceId: data.propertyAgenceId,
          title: data.title,
        },
      },
    });

    if (uniqueName) {
      throw new HttpError(
        'Une propriété avec ce titre existe déjà pour votre agence',
        HttpStatus.CONFLICT,
        'PROPERTY_ALREADY_EXISTS',
      );
    }

    await this.prisma.property.create({
      data,
    });

    return {
      message: 'Propriété créée avec succès',
    };
  }
  async updateProperty(ownerId: string, propertyId: string, data: propertyDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new HttpError(
        'Propriété introuvable',
        HttpStatus.NOT_FOUND,
        'PROPERTY_NOT_FOUND',
      );
    }

    await this.agencyService.checkAgencyOwnership(
      ownerId,
      property.propertyAgenceId,
    );

    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data,
    });
  }

  async getOccupationRateByType1(ownerId: string, agencyId: string) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);

    const properties = await this.prisma.property.findMany({
      where: {
        propertyAgenceId: agencyId,
      },
      select: {
        type: true,
        status: true,
      },
    });

    const stats = properties.reduce(
      (acc, property) => {
        const type = property.type;

        if (!acc[type]) {
          acc[type] = { total: 0, occupied: 0 };
        }

        acc[type].total++;

        if (property.status !== 'AVAILABLE') {
          acc[type].occupied++;
        }

        return acc;
      },
      {} as Record<string, { total: number; occupied: number }>,
    );

    return Object.entries(stats).map(([type, value]) => ({
      type,
      total: value.total,
      occupied: value.occupied,
      occupationRate:
        value.total === 0
          ? 0
          : Math.round((value.occupied / value.total) * 100),
    }));
  }

  /**
   * Stats: Taux d'occupation par type de propriété
   */
  async getOccupationRateByType(ownerId: string, agencyId: string) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);

    const properties = await this.prisma.property.findMany({
      where: { propertyAgenceId: agencyId },
      select: {
        type: true,
        status: true,
      },
    });

    const grouped: Record<string, { total: number; occupied: number }> = {};

    properties.forEach((p) => {
      if (!grouped[p.type]) grouped[p.type] = { total: 0, occupied: 0 };
      grouped[p.type].total += 1;
      if (p.status !== 'AVAILABLE') grouped[p.type].occupied += 1;
    });

    const result = Object.entries(grouped).map(
      ([type, { total, occupied }]) => ({
        propertyType: type,
        occupationRate: Math.round((occupied / total) * 100),
      }),
    );

    return result;
  }

  /**
   * Stats: Revenus mensuels par maison occupée (fake API pour dev)
   */
  async getMonthlyRevenue(ownerId: string, agencyId: string) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);

    const properties = await this.prisma.property.findMany({
      where: {
        propertyAgenceId: agencyId,
        status: { not: 'AVAILABLE' },
      },
      select: { price: true },
    });

    const expectedAmount = properties.reduce(
      (sum, p) => sum + Number(p.price),
      0,
    );

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return months.map((month) => {
      const remainingAmount = Math.floor(Math.random() * expectedAmount * 0.4);
      const receivedAmount = expectedAmount - remainingAmount;

      return {
        month,
        receivedAmount,
        remainingAmount,
      };
    });
  }
}
