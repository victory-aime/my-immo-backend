import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { AgencyService } from '_root/modules/agency/agency.service';
import { HttpError } from '_root/config/http.error';
import { convertToInteger } from '_root/config/convert';
import { CreateLandDto, LandFilterDto, UpdateLandDto } from '_root/modules/land/land.dto';
import { Prisma } from '../../../prisma/generated/client';

@Injectable()
export class LandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyService: AgencyService,
  ) {}

  async getAllLandByAgency(query: LandFilterDto) {
    await this.agencyService.agencyAccessControl(query?.agencyId, query?.userId);

    const pageInitial = convertToInteger(query?.initialPage) || 1;
    const limitPage = convertToInteger(query?.limitPerPage) || 10;

    const skip = (pageInitial - 1) * limitPage;

    const landFilterOptions = {
      agencyId: query?.agencyId,
      ...(query?.title && {
        title: {
          contains: query.title,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
      ...(query?.status && { status: query?.status }),
      ...(query?.city && { city: query?.city }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.land.findMany({
        where: landFilterOptions,
        include: { batiments: true },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitPage,
      }),

      this.prisma.land.count({
        where: landFilterOptions,
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

  async createLand(data: CreateLandDto): Promise<{ message: string }> {
    await this.agencyService.agencyAccessControl(data.agencyId, data?.userId);

    const { userId, ...safeValues } = data;
    const uniqueName = await this.prisma.land.findUnique({
      where: {
        title_agencyId: { title: data?.title, agencyId: data?.agencyId },
      },
    });

    if (uniqueName) {
      throw new HttpError(
        'Un Terrain avec ce titre existe déjà pour votre agence',
        HttpStatus.CONFLICT,
        'LAND_ALREADY_EXISTS',
      );
    }

    await this.prisma.land.create({
      data: {
        ...safeValues,
      },
    });

    return {
      message: 'Terrain créée avec succès',
    };
  }

  async updateLand(data: UpdateLandDto): Promise<{ message: string }> {
    await this.agencyService.agencyAccessControl(data.agencyId, data?.userId);

    const { userId, agencyId, ...safeValues } = data;

    const land = await this.prisma.land.findUnique({
      where: { id: data?.id },
    });

    if (!land) {
      throw new HttpError('Terrain introuvable', HttpStatus.NOT_FOUND, 'LAND_NOT_FOUND');
    }

    if (data.title && data.title !== land.title) {
      const existing = await this.prisma.land.findUnique({
        where: {
          title_agencyId: {
            agencyId: land.agencyId!,
            title: data.title,
          },
        },
      });

      if (existing) {
        throw new HttpError(
          'Un terrain avec ce titre existe déjà',
          HttpStatus.CONFLICT,
          'LAND_ALREADY_EXISTS',
        );
      }
    }

    await this.prisma.land.update({
      where: { id: data?.id },
      data: {
        ...safeValues,
      },
    });

    return {
      message: 'Terrain créé avec succès',
    };
  }

  async deleteLand() {}
}
