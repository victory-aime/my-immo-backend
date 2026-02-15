import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { propertyDto } from '_root/modules/property/property.dto';
import { HttpError } from '_root/config/http.error';

@Injectable()
export class PropertyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllProperties(agencyId: string) {
    const allProperties = await this.prismaService.property.findMany({
      where: {
        propertyAgenceId: agencyId,
      },
    });
    if (!allProperties) {
      throw new NotFoundException('Aucune propriété trouvée pour cette agence');
    }
    return allProperties;
  }

  async createProperty(data: propertyDto): Promise<{ message: string }> {
    try {
      const uniqueName = await this.prismaService.property.findUnique({
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

      await this.prismaService.property.create({
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
    return this.prismaService.property.update({
      where: {
        id: propertyId,
      },
      data,
    });
  }
}
