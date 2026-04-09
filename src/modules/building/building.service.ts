import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BuildingFilterDto,
  CreateBuildingDto,
  UpdateBuildingDto,
} from '_root/modules/building/building.dto';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '_root/config/http.error';
import { AgencyService } from '_root/modules/agency/agency.service';
import { convertToInteger } from '_root/config/convert';

@Injectable()
export class BuildingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyService: AgencyService,
  ) {}

  async getAllBuildingByAgency(query: BuildingFilterDto) {
    await this.agencyService.checkAgencyOwnership(
      query?.ownerId,
      query?.agencyId,
    );

    const pageInitial = convertToInteger(query?.initialPage) || 1;
    const limitPage = convertToInteger(query?.limitPerPage) || 10;

    const skip = (pageInitial - 1) * limitPage;

    const buildingFilterOptions = {
      ...{ agencyId: query?.agencyId },
      ...(query.name && { name: query.name }),
      ...(query.city && { city: query.city }),
      ...(query.status && { status: query.status }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.batiment.findMany({
        where: buildingFilterOptions,
        include: { properties: true },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitPage,
      }),

      this.prisma.batiment.count({
        where: buildingFilterOptions,
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

  async createBuilding(
    data: CreateBuildingDto,
    ownerId: string,
  ): Promise<{ message: string }> {
    await this.agencyService.checkAgencyOwnership(ownerId, data.agencyId);

    const uniqueName = await this.prisma.batiment.findUnique({
      where: { name_agencyId: { name: data?.name, agencyId: data?.agencyId } },
    });

    if (uniqueName) {
      throw new HttpError(
        'Un bâtiment avec ce titre existe déjà pour votre agence',
        HttpStatus.CONFLICT,
        'BATIMENT_ALREADY_EXISTS',
      );
    }

    await this.prisma.batiment.create({
      data: {
        ...data,
        landId: data.landId && data.landId !== '' ? data.landId : undefined,
      },
    });

    return {
      message: 'Bâtiment créée avec succès',
    };
  }

  async updateBuilding(
    data: UpdateBuildingDto,
    ownerId: string,
  ): Promise<{ message: string }> {
    await this.agencyService.checkAgencyOwnership(ownerId, data.agencyId);

    const findBuilding = await this.prisma.batiment.findUnique({
      where: { id: data.id },
    });

    if (!findBuilding) {
      throw new HttpError(
        'Aucun bâtiment trouvé',
        HttpStatus.NOT_FOUND,
        'BATIMENT_NOT_EXIST',
      );
    }

    await this.prisma.batiment.update({
      where: { id: data?.id },
      data: {
        ...data,
        landId: data.landId && data.landId !== '' ? data.landId : undefined,
      },
    });
    return {
      message: 'Bâtiment mis a jour avec succès',
    };
  }

  async deleteBuilding(id: string, ownerId: string, agencyId: string) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);
    await this.prisma.batiment.delete({
      where: { id },
    });
  }
}
