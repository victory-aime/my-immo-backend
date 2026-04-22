import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HttpError } from '_root/config/http.error';
import { AnnonceStatus } from '../../../prisma/generated/enums';
import { Annonce } from '../../../prisma/generated/client';

export class CreateAnnonceDto {
  propertyId: string;
  description: string;
  galleryImages: string[];
}

export class UpdateAnnonceDto {
  description?: string;
  galleryImages?: string[];
  status?: AnnonceStatus;
}

@Injectable()
export class AnnonceService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CRÉER une annonce
  async createAnnonce(dto: CreateAnnonceDto): Promise<Annonce> {
    if (!dto.galleryImages || dto.galleryImages.length === 0) {
      throw new HttpError(
        'Vous devez fournir au moins une image.',
        HttpStatus.BAD_REQUEST,
        'IMAGES_REQUIRED',
      );
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new HttpError(
        `Certains informations sont manquantes`,
        HttpStatus.NOT_FOUND,
        'PROPERTY_NOT_FOUND',
      );
    }

    return this.prisma.annonce.create({
      data: {
        propertyId: dto.propertyId,
        description: dto.description,
        galleryImages: dto.galleryImages,
        publishedAt: new Date(),
        status: AnnonceStatus.ACTIVE,
      },
      include: {
        property: true,
      },
    });
  }

  // 2. LISTE GLOBALE
  async findAllAnnonces(): Promise<Annonce[]> {
    return this.prisma.annonce.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 3. LISTE PAR AGENCE
  async findAnnoncesByAgency(agencyId: string): Promise<Annonce[]> {
    if (!agencyId) {
      throw new HttpError(
        ' Certains informations sont manquantes',
        HttpStatus.BAD_REQUEST,
        'MISSING_AGENCY_ID',
      );
    }

    return this.prisma.annonce.findMany({
      where: {
        property: {
          agencyId: agencyId,
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 4. MODIFIER une annonce
  async updateAnnonce(id: string, dto: UpdateAnnonceDto): Promise<Annonce> {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
    });

    if (!annonce) {
      throw new HttpError(`Annonce introuvable )`, HttpStatus.NOT_FOUND, 'ANNONCE_NOT_FOUND');
    }

    return this.prisma.annonce.update({
      where: { id },
      data: {
        description: dto.description,
        galleryImages: dto.galleryImages,
        status: dto.status,
      },
      include: {
        property: true,
      },
    });
  }

  // 5. SUPPRIMER une annonce - Renvoie un objet de succès
  async deleteAnnonce(id: string): Promise<{ success: boolean; message: string }> {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
    });

    if (!annonce) {
      throw new HttpError(`Impossible de supprimer.`, HttpStatus.NOT_FOUND, 'ANNONCE_NOT_FOUND');
    }

    await this.prisma.annonce.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Annonce est supprimée avec succès`,
    };
  }
}
