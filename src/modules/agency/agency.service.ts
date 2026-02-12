import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { createAgencyOwnerDto } from './agency.dto';
import { UserRole } from '_prisma/enums';
import { UsersService } from '_root/modules/users/users.service';

@Injectable()
export class AgencyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}
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

  async checkAgencyName(name: string): Promise<boolean> {
    const agencyName = await this.prismaService.propertyAgency.findUnique({
      where: { name },
    });
    return !agencyName;
  }
}
