import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(where: { id?: string; email?: string; phoneNumber?: string }) {
    if (!where.id && !where.email && !where.phoneNumber) return null;

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

  async checkUserEmail(email: string): Promise<boolean> {
    const user = await this.findUser({ email });
    return !!user;
  }
}
