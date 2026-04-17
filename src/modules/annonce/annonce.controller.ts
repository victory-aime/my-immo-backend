import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  AnnonceService,
  CreateAnnonceDto,
  UpdateAnnonceDto,
} from './annonce.service';
import { API_URL } from '_root/config/api';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '_root/modules/cloudinary/uploads.service';
import { CLOUDINARY_FOLDER_NAME } from '_root/config/enum';

@ApiTags('Annonces')
@Controller()
export class AnnonceController {
  constructor(
    private readonly annonceService: AnnonceService,
    private readonly uploadFileService: UploadsService, // ✅ Injection du service d'upload
  ) {}

  // 1. CRÉER UNE ANNONCE (Avec Upload d'images)
  @AllowAnonymous()
  @ApiBearerAuth()
  @Post(API_URL.ANNONCE.CREATE)
  @ApiConsumes('multipart/form-data') //  Précise à Swagger qu'on envoie des fichiers
  @ApiOperation({
    summary: 'Publier une nouvelle annonce immobilière avec images',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agencyName: {
          type: 'string',
          description: "Nom de l'agence pour le dossier Cloudinary",
        },
        propertyId: { type: 'string' },
        description: { type: 'string' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Annonce créée avec succès' })
  @ApiBadRequestResponse({ description: 'Données ou fichiers invalides' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }])) //  Intercepte les fichiers nommés "images"
  async create(
    @Body() dto: CreateAnnonceDto,
    @Body('agencyName') agencyName: string, //  Récupère le nom de l'agence pour le chemin Cloudinary
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    let cloudinaryImagesUrls: string[] = [];

    if (files?.images?.length) {
      //  Upload de chaque image vers le dossier spécifique de l'agence
      const uploads = await Promise.all(
        files.images.map((file) =>
          this.uploadFileService.uploadFiles(
            file,
            agencyName || 'agence-anonyme',
            CLOUDINARY_FOLDER_NAME.ANNONCE, // Utilise l'énum que tu as créé
          ),
        ),
      );

      cloudinaryImagesUrls = uploads.map((res) => res.secure_url);
    }

    //  Enregistre l'annonce avec les URLs Cloudinary dans galleryImages
    return this.annonceService.createAnnonce({
      ...dto,
      galleryImages: cloudinaryImagesUrls,
    });
  }

  // 2. LISTE GLOBALE
  @AllowAnonymous()
  @Get(API_URL.ANNONCE.FIND_ALL)
  @ApiOperation({ summary: 'Récupérer toutes les annonces actives' })
  @ApiOkResponse({ description: 'Liste des annonces récupérée' })
  async findAll() {
    return this.annonceService.findAllAnnonces();
  }

  // 3. LISTE PAR AGENCE
  @Get(API_URL.ANNONCE.FIND_BY_AGENCY)
  @ApiOperation({ summary: 'Récupérer les annonces d’une agence spécifique' })
  async findByAgency(@Query('agencyId') agencyId: string) {
    return this.annonceService.findAnnoncesByAgency(agencyId);
  }

  // 4. MODIFIER
  @ApiBearerAuth()
  @Put(API_URL.ANNONCE.UPDATE)
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  async update(@Query('id') id: string, @Body() dto: UpdateAnnonceDto) {
    return this.annonceService.updateAnnonce(id, dto);
  }

  // 5. SUPPRIMER
  @ApiBearerAuth()
  @Delete(API_URL.ANNONCE.DELETE)
  @ApiOperation({ summary: 'Supprimer une annonce' })
  async remove(@Query('id') id: string) {
    return this.annonceService.deleteAnnonce(id);
  }
}
