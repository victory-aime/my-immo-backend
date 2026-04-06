import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { API_URL } from '_root/config/api';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { propertyDto } from './property.dto';
import { PropertyService } from './property.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '_root/modules/cloudinary/uploads.service';
import { AgencyService } from '_root/modules/agency/agency.service';
import { convertToInteger } from '_root/config/convert';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CLOUDINARY_FOLDER_NAME } from '_root/config/enum';
import { Throttle } from '@nestjs/throttler';

@Controller()
@ApiBearerAuth()
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly uploadFileService: UploadsService,
    private readonly agencyService: AgencyService,
  ) {}
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Get(API_URL.PROPERTY.ALL_PROPERTIES_BY_AGENCY)
  @ApiOperation({ summary: 'Récupérer toutes les propriétés' })
  @ApiOkResponse({
    description: 'Liste des propriétés récupérée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async allProperties(
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
    @Query('initialPage') initialPage: number,
    @Query('limitPerPage') limitPerPage: number,
  ) {
    const page = convertToInteger(initialPage) || 1;
    const limit = convertToInteger(limitPerPage) || 10;

    return this.propertyService.getAllPropertyByAgency(
      ownerId,
      agencyId,
      page,
      limit,
    );
  }

  @Get(API_URL.PROPERTY.ALL_PROPERTIES_PUBLIC)
  @AllowAnonymous()
  @ApiOperation({ summary: 'Récupérer toutes les propriétés' })
  @ApiOkResponse({
    description: 'Liste des propriétés récupérée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async publicProperties() {
    const properties = await this.propertyService.getAllPublicProperties();
    return properties?.map((property) => ({
      ...property,
      price: property.price.toNumber(),
      locationCaution: property.caution?.toNumber(),
    }));
  }

  @Post(API_URL.PROPERTY.CREATE_PROPERTY)
  @ApiOperation({ summary: 'Créer une nouvelle propriété' })
  @ApiBody({
    type: propertyDto,
  })
  @ApiOkResponse({
    description: 'Propriété ajoutée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'galleryImages', maxCount: 4 }]),
  )
  async createProperty(
    @Body() data: propertyDto,
    @Query('ownerId') ownerId: string,
    @UploadedFiles()
    files: {
      galleryImages?: Express.Multer.File[];
    },
  ) {
    let cloudinaryGalleryFilesUrl: string[] = [];
    const getAgencyName = await this.agencyService.findAgency(
      data?.agencyId,
      ownerId,
    );
    if (files?.galleryImages?.length) {
      for (const gallery of files.galleryImages) {
        const uploadDocument = await this.uploadFileService.uploadFiles(
          gallery,
          getAgencyName?.name,
          CLOUDINARY_FOLDER_NAME.PROPERTY,
        );
        cloudinaryGalleryFilesUrl.push(uploadDocument.secure_url);
      }
    }

    return this.propertyService.createProperty(ownerId, {
      ...data,
      price: convertToInteger(data?.price),
      rooms: convertToInteger(data?.rooms),
      area: convertToInteger(data?.area),
      bathrooms: convertToInteger(data?.bathrooms),
      caution: convertToInteger(data?.caution),
      galleryImages: cloudinaryGalleryFilesUrl,
    });
  }

  @Post(API_URL.PROPERTY.UPDATE_PROPERTY)
  @ApiOperation({ summary: 'Mettre a jour une propriété' })
  @ApiBody({
    type: propertyDto,
  })
  @ApiOkResponse({
    description: 'Propriété mise a jour avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'galleryImages', maxCount: 4 }]),
  )
  async updateProperty(
    @Body() data: propertyDto,
    @Query('ownerId') ownerId: string,
    @Query('appartId') appartId: string,
    @UploadedFiles()
    files: {
      galleryImages?: Express.Multer.File[];
    },
  ) {
    let cloudinaryGalleryFilesUrl: string[] = [];
    const getAgencyName = await this.agencyService.findAgency(
      data?.agencyId,
      ownerId,
    );
    if (files?.galleryImages?.length) {
      for (const gallery of files.galleryImages) {
        const uploadFiles = await this.uploadFileService.uploadFiles(
          gallery,
          getAgencyName?.name,
          CLOUDINARY_FOLDER_NAME.PROPERTY,
        );
        cloudinaryGalleryFilesUrl.push(uploadFiles.secure_url);
      }
    }

    return this.propertyService.updateProperty(ownerId, appartId, {
      ...data,
      price: convertToInteger(data?.price),
      rooms: convertToInteger(data?.rooms),
      area: convertToInteger(data?.area),
      bathrooms: convertToInteger(data?.bathrooms),
      caution: convertToInteger(data?.caution),
      galleryImages: cloudinaryGalleryFilesUrl,
    });
  }

  @Get(API_URL.PROPERTY.OCCUPATION_RATE_BY_PROPERTY_TYPE)
  @ApiOperation({
    summary: "Récupérer le taux d'occupation par type de propriété",
  })
  @ApiOkResponse({
    description: 'Stats envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async getOccupationRate(
    @Query('ownerId') ownerId: string,
    @Query('agencyId') agencyId: string,
  ) {
    return this.propertyService.getOccupationRateByType(ownerId, agencyId);
  }

  @Get(API_URL.PROPERTY.MONTHLY_REVENUE)
  @ApiOperation({
    summary: 'Récupérer les revenues par propriétés actuellement fake API',
  })
  @ApiOkResponse({
    description: 'Stats envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async monthlyRevenue(
    @Query('ownerId') ownerId: string,
    @Query('agencyId') agencyId: string,
  ) {
    return this.propertyService.getMonthlyRevenue(ownerId, agencyId);
  }
}
