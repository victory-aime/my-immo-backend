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
import { createAgencyOwnerDto, updateAgencyDto } from './agency.dto';
import { AgencyService } from './agency.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '_root/modules/cloudinary/uploads.service';
import { CLOUDINARY_FOLDER_NAME } from '_root/config/enum';

@Controller()
export class AgencyController {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly uploadFileService: UploadsService,
  ) {}

  @ApiBearerAuth()
  @Get(API_URL.AGENCY.AGENCY_INFO)
  @ApiOperation({ summary: "Infos d'une agence" })
  @ApiOkResponse({
    description: 'Info récupérer avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async agencyInfo(@Query('agencyId') agencyId: string) {
    return this.agencyService.findAgency(agencyId);
  }

  @ApiBearerAuth()
  @Post(API_URL.AGENCY.CREATE_AGENCY)
  @ApiOperation({ summary: 'Créer une agence' })
  @ApiBody({
    type: createAgencyOwnerDto,
  })
  @ApiOkResponse({
    description: 'Agence créer avec success en attente de validation',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'agencyLogo', maxCount: 1 },
      { name: 'documents', maxCount: 5 },
    ]),
  )
  async createAgency(
    @Body() data: createAgencyOwnerDto,
    @UploadedFiles()
    files: {
      agencyLogo?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    let cloudinaryAgencyLogoFileUrl: string = '';
    let cloudinaryDocumentsFileUrl: string[] = [];

    if (files?.agencyLogo?.length) {
      const uploadAgencyLogo = await this.uploadFileService.uploadAgencyImage(
        files.agencyLogo[0],
        data.name,
        CLOUDINARY_FOLDER_NAME.LOGO,
      );
      cloudinaryAgencyLogoFileUrl = uploadAgencyLogo.secure_url;
    }
    if (files?.documents?.length) {
      for (const document of files.documents) {
        const uploadDocument = await this.uploadFileService.uploadAgencyImage(
          document,
          data.name,
          CLOUDINARY_FOLDER_NAME.DOC,
        );
        cloudinaryDocumentsFileUrl.push(uploadDocument.secure_url);
      }
    }
    return this.agencyService.createAgency({
      ...data,
      agencyLogo: cloudinaryAgencyLogoFileUrl,
      documents: cloudinaryDocumentsFileUrl,
    });
  }

  @ApiBearerAuth()
  @Post(API_URL.AGENCY.UPDATE_AGENCY)
  @ApiOperation({ summary: "Mettre a jour les informations d'une agence" })
  @ApiBody({
    type: updateAgencyDto,
  })
  @ApiOkResponse({
    description: 'Agence modifiée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'agencyLogo', maxCount: 1 }]))
  async updateAgency(
    @Body() data: updateAgencyDto,
    @UploadedFiles()
    files: {
      agencyLogo?: Express.Multer.File[];
    },
  ) {
    let cloudinaryAgencyLogoFileUrl: string = '';

    if (files?.agencyLogo?.length) {
      const uploadAgencyLogo = await this.uploadFileService.uploadAgencyImage(
        files.agencyLogo[0],
        data.name,
        CLOUDINARY_FOLDER_NAME.LOGO,
      );
      cloudinaryAgencyLogoFileUrl = uploadAgencyLogo.secure_url;
    }

    return this.agencyService.updateAgency({
      ...data,
      agencyLogo: cloudinaryAgencyLogoFileUrl,
    });
  }

  @ApiBearerAuth()
  @Post(API_URL.AGENCY.CLOSE_AGENCY)
  @ApiOperation({ summary: 'Fermée votre agence' })
  @ApiOkResponse({
    description: 'Agence fermée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async closeAgency(
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.agencyService.closeAgency({ agencyId, ownerId });
  }

  @Post(API_URL.AGENCY.CHECK_NAME)
  @ApiOperation({
    summary: 'Verifier si une agence portant ce nom existe deja',
  })
  @ApiOkResponse({
    description: 'return un boolean',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async checkAgencyName(@Body() data: { name: string }) {
    return this.agencyService.checkAgencyName(data?.name);
  }
}
