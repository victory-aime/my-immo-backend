import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnnonceStatus } from '../../../prisma/generated/enums';

//  pour créer une annonce
export class CreateAnnonceDto {
  propertyId!: string;
  description!: string;
  galleryImages?: string[];
}

//  pour modifier une annonce
export class UpdateAnnonceDto {
  description?: string;
  galleryImages?: string[];
  status?: AnnonceStatus;
}

@Injectable()
export class AnnonceService {
  // On injecte PrismaService pour parler à la base de données
  constructor(private readonly prisma: PrismaService) {}

  //  CRÉER une annonce
  async createAnnonce(dto: CreateAnnonceDto) {
    return this.prisma.annonce.create({
      data: {
        propertyId: dto.propertyId,
        description: dto.description,
        galleryImages: dto.galleryImages ?? [],
        publishedAt: new Date(),
      },
      include: {
        property: true, // on inclut les infos de la propriété
      },
    });
  }

  //  LISTE GLOBALE — toutes les annonces
  async findAllAnnonces() {
    return this.prisma.annonce.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc', // les plus récentes en premier
      },
    });
  }

  //  LISTE PAR AGENCE — annonces filtrées par agencyId
  async findAnnoncesByAgency(agencyId: string) {
    return this.prisma.annonce.findMany({
      where: {
        property: {
          agencyId: agencyId, // on filtre par l'ID de l'agence
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

  // MODIFIER une annonce
  async updateAnnonce(id: string, dto: UpdateAnnonceDto) {
    // On vérifie que l'annonce existe
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
    });

    if (!annonce) {
      throw new NotFoundException(`Annonce ${id} introuvable`);
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

  // SUPPRIMER une annonce
  async deleteAnnonce(id: string) {
    // On vérifie que l'annonce existe
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
    });

    if (!annonce) {
      throw new NotFoundException(`Annonce ${id} introuvable`);
    }

    await this.prisma.annonce.delete({
      where: { id },
    });

    return { message: 'Annonce supprimée avec succès' };
  }
}
