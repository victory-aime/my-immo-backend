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

@Controller()
@ApiBearerAuth()
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly uploadFileService: UploadsService,
    private readonly agencyService: AgencyService,
  ) {}

  @Get(API_URL.PROPERTY.ALL_PROPERTIES)
  @ApiOperation({ summary: 'Récupérer toutes les propriétés' })
  @ApiOkResponse({
    description: 'Liste des propriétés récupérée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async allProperties(@Query('agencyId') agencyId: string) {
    const properties = await this.propertyService.getAllProperties(agencyId);
    return properties?.map((property) => ({
      ...property,
      price: property.price.toNumber(),
    }));
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
      locationCaution: property.locationCaution?.toNumber(),
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
    @UploadedFiles()
    files: {
      galleryImages?: Express.Multer.File[];
    },
  ) {
    let cloudinaryGalleryFilesUrl: string[] = [];
    const getAgencyName = await this.agencyService.findAgency(
      data?.propertyAgenceId,
    );
    if (files?.galleryImages?.length) {
      for (const gallery of files.galleryImages) {
        const uploadDocument = await this.uploadFileService.uploadAgencyImage(
          gallery,
          getAgencyName?.name,
          CLOUDINARY_FOLDER_NAME.PROPERTY,
        );
        cloudinaryGalleryFilesUrl.push(uploadDocument.secure_url);
      }
    }

    return this.propertyService.createProperty({
      ...data,
      price: convertToInteger(data?.price),
      rooms: convertToInteger(data?.rooms),
      surface: convertToInteger(data?.surface),
      sdb: convertToInteger(data?.sdb),
      locationCaution: convertToInteger(data?.locationCaution),
      postalCode: convertToInteger(data?.postalCode),
      galleryImages: cloudinaryGalleryFilesUrl,
    });
  }
}
