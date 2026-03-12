import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { propertyDto } from '_root/modules/property/property.dto';
import { HttpError } from '_root/config/http.error';
import { Property } from '_prisma/client';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPropertyByAgency(
    agencyId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    content: Property[];
    totalDataPerPage: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
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
        take: limit,
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

  async createProperty(data: propertyDto): Promise<{ message: string }> {
    try {
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
        data: {
          ...data,
          propertyAgenceId: data.propertyAgenceId,
        },
      });

      return {
        message: 'Propriété créée avec succès',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpError(
        'Impossible de créer la propriété',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PROPERTY_CREATE_FAILED',
      );
    }
  }

  async updateProperty(propertyId: string, data: any) {
    return this.prisma.property.update({
      where: {
        id: propertyId,
      },
      data,
    });
  }
}
