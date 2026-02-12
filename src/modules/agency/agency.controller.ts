import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { API_URL } from '_root/config/api';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { createAgencyOwnerDto } from './agency.dto';
import { AgencyService } from './agency.service';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UploadsService } from '_root/modules/cloudinary/uploads.service';

@Controller()
export class AgencyController {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly uploadFileService: UploadsService,
  ) {}
  @ApiBearerAuth()
  @AllowAnonymous()
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
    console.log(files);
    let cloudinaryAgencyLogoFileUrl: string = '';
    let cloudinaryDocumentsFileUrl: string[] = [];

    if (files?.agencyLogo?.length) {
      const uploadAgencyLogo = await this.uploadFileService.uploadAgencyImage(
        files.agencyLogo[0],
        data.name,
      );
      cloudinaryAgencyLogoFileUrl = uploadAgencyLogo.secure_url;
    }
    if (files?.documents?.length) {
      for (const document of files.documents) {
        const uploadDocument = await this.uploadFileService.uploadAgencyImage(
          document,
          data.name,
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

  @AllowAnonymous()
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
