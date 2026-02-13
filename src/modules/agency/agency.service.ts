import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { createAgencyOwnerDto, updateAgencyDto } from './agency.dto';
import { UserRole, PropertyAgencyStatus } from '_prisma/enums';
import { UsersService } from '_root/modules/users/users.service';

@Injectable()
export class AgencyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async findAgency(agencyId: string, ownerId?: string) {
    const getAgency = await this.prismaService.propertyAgency.findUnique({
      where: { id: agencyId, ownerId },
    });
    if (!getAgency) {
      throw new NotFoundException('Agency not found');
    }
    return getAgency;
  }

  async createAgency(data: createAgencyOwnerDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.userService.findUser({
        id: data?.userId,
      });

      if (!existingUser) {
        throw new BadRequestException(
          'Un utilisateur avec cet email ou numéro de téléphone existe déjà.',
        );
      }

      await this.prismaService.$transaction(async (prisma) => {
        const propertyOwner = await prisma.propertyOwner.create({
          data: { userId: existingUser.id },
        });
        await prisma.user.update({
          where: { id: existingUser?.id },
          data: {
            role: UserRole.IMMO_OWNER,
          },
        });
        await prisma.propertyAgency.create({
          data: {
            name: data?.name,
            address: data?.address,
            agencyLogo: data?.agencyLogo,
            description: data?.description,
            documents: data?.documents,
            phone: data?.phone,
            acceptTerms: data?.acceptTerms,
            owner: {
              connect: {
                id: propertyOwner?.id,
              },
            },
          },
        });
      });

      return {
        message:
          'Votre agence a été créé avec succès et est en attente de validation.',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Erreur onboarding salon owner:', error);

      throw new InternalServerErrorException(
        'Une erreur interne est survenue. Veuillez réessayer plus tard.',
      );
    }
  }

  async updateAgency(data: updateAgencyDto): Promise<{ message: string }> {
    try {
      const getAgency = await this.findAgency(data?.agencyId);
      await this.prismaService.propertyAgency.update({
        where: { id: getAgency?.id },
        data: {
          name: data?.name,
          description: data?.description,
          address: data?.address,
          phone: data?.phone,
          agencyLogo: data?.agencyLogo,
        },
      });
      return { message: 'yes' };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException('', {
        description: 'Une erreur est survenu reessayer plus tard',
      });
    }
  }

  async closeAgency(data: { agencyId: string; ownerId: string }) {
    const agency = await this.findAgency(data?.agencyId);
    const getOwner = await this.prismaService.propertyOwner.findUnique({
      where: {
        id: data.ownerId,
      },
    });
    if (!getOwner) {
      throw new BadRequestException(
        'Une erreur est survenue réessayer plus tard',
      );
    }
    await this.prismaService.propertyAgency.update({
      where: { id: agency?.id },
      data: {
        status: PropertyAgencyStatus.CLOSE,
      },
    });
    await this.prismaService.user.update({
      where: { id: getOwner?.userId },
      data: {
        role: UserRole.USER,
      },
    });
  }

  async checkAgencyName(name: string): Promise<boolean> {
    const agencyName = await this.prismaService.propertyAgency.findUnique({
      where: { name },
    });
    return !agencyName;
  }
}
