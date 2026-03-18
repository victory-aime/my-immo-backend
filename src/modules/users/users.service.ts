import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { User } from '../../../prisma/generated/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(where: { id?: string; email?: string }) {
    if (!where.id && !where.email) return null;

    const uniqueWhere = where.id ? { id: where.id } : { email: where.email };

    const user = await this.prisma.user.findUnique({
      where: uniqueWhere,
      include: {
        accounts: {
          select: {
            providerId: true,
          },
        },
        propertyOwner: {
          select: {
            id: true,
            propertyAgency: {
              select: {
                id: true,
              },
            },
          },
        },
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
      return user;
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async getAllUsers(
    page: number,
    limit: number,
  ): Promise<{
    content: User[];
    totalDataPerPages: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { role: { in: ['USER', 'IMMO_OWNER'] } },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.user.count({
        where: { role: { in: ['USER', 'IMMO_OWNER'] } },
      }),
    ]);

    return {
      content: data,
      totalDataPerPages: limit,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async checkUserEmail(email: string): Promise<boolean> {
    const user = await this.findUser({ email });
    return !!user;
  }
}
