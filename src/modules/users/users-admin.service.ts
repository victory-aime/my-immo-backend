import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { Role, UserStatus } from '../../../prisma/generated/enums';
import { HttpError } from '_root/config/http.error';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prismaService: PrismaService) {}

  // ─────────────────────────────────────────
  // 1. Liste tous les users avec filtrage par rôle
  // ─────────────────────────────────────────
  async getAllUsers(params: { page: number; limit: number; role?: Role }): Promise<{
    content: any[];
    totalDataPerPages: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const { page, limit, role } = params;
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    try {
      const [data, total] = await this.prismaService.$transaction([
        this.prismaService.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: {
                id: true,
                agency: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
            staff: {
              select: {
                id: true,
                agencyRole: true,
                isActive: true,
                agency: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            client: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),

        this.prismaService.user.count({ where }),
      ]);

      return {
        content: data,
        totalDataPerPages: limit,
        currentPage: page,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        'Une erreur est survenue lors de la récupération des utilisateurs.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─────────────────────────────────────────
  // 2. Bloquer / Débloquer un utilisateur
  // ─────────────────────────────────────────
  async updateUserStatus(userId: string, status: UserStatus): Promise<{ message: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpError(`Utilisateur introuvable`, HttpStatus.NOT_FOUND, 'USER_NOT_FOUND');
    }

    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: { status },
      });

      return {
        message: `Le statut de l'utilisateur a été modifié avec succès.`,
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        'Une erreur est survenue lors de la mise à jour du statut.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
