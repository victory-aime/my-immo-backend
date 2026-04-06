import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { User } from '../../../prisma/generated/client';
import { getAuthInstance } from '_root/lib/auth';
import { HttpError } from '_root/config/http.error';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getBetterAuthInstance() {
    return getAuthInstance();
  }

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
        owner: {
          select: {
            id: true,
            agency: {
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
        where: { role: { in: ['USER', 'OWNER'] } },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.user.count({
        where: { role: { in: ['USER', 'OWNER'] } },
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

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        sessions: true,
        owner: {
          include: {
            agency: true,
          },
        },
      },
    });
  }

  async checkUserEmail(email: string): Promise<boolean> {
    const user = await this.findUser({ email });
    return !!user;
  }
}
