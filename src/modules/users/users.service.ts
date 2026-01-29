import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '_prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(where: { id?: string; email?: string; phoneNumber?: string }) {
    if (!where.id && !where.email && !where.phoneNumber) return null;

    const uniqueWhere = where.id ? { id: where.id } : { email: where.email };

    const user = await this.prisma.user.findUnique({
      where: uniqueWhere,
      include: {
        accounts: true,
      },
    });

    if (!user) return null;

    return user;
  }

  async userInfo(id: string) {
    try {
      const user = await this.findUser({ id });
      if (!user) {
        throw new NotFoundException('No user');
      }
      const { password: _, ...userData } = user;
      return {
        ...userData,
      };
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async resetPassword(
    data: { id?: string; email?: string },
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.findUser({
        id: data?.id,
        email: data?.email,
      });

      if (!user) {
        throw new NotFoundException(
          "Ce compte n'existe plus ou a été supprimé.",
        );
      }

      // Vérifie si le nouveau mot de passe est identique à l'ancien
      const isSamePassword = await bcrypt.compare(newPassword, user.password!);
      if (isSamePassword) {
        throw new BadRequestException(
          "Le nouveau mot de passe doit être différent de l'ancien pour des raisons de sécurité.",
        );
      }

      // Hash du nouveau mot de passe avant enregistrement
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return {
        message: '✅ Votre mot de passe a été mis à jour avec succès.',
      };
    } catch (error) {
      console.error(
        'Erreur lors de la réinitialisation du mot de passe :',
        error,
      );

      // Gestion plus précise de l'erreur
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        'Une erreur est survenue lors de la mise à jour du mot de passe. Veuillez réessayer plus tard.',
      );
    }
  }

  async regeneratePassword(email: string, newPassword: string) {
    try {
      const user = await this.findUser({ email });
      if (!user) {
        throw new NotFoundException(
          "Ce compte n'existe plus ou a été supprimé.",
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      return {
        message: '✅ Votre mot de passe a été régénéré avec succès.',
        newPassword,
      };
    } catch (error) {
      console.error('Erreur lors de la régénération du mot de passe :', error);
      throw new BadRequestException(
        'Une erreur est survenue lors de la régénération du mot de passe. Veuillez réessayer plus tard.',
      );
    }
  }
}
