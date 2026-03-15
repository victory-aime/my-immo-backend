import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { ApplicationService } from './application.service';
import { ApplicationDto } from './application.dto';
import { convertToInteger } from '../../config/convert';

@Controller()
export class ApplicationController {
  constructor(private readonly rentalService: ApplicationService) {}

  @Post(API_URL.APPLICATION.CREATE)
  @ApiBody({ type: ApplicationDto })
  @ApiOperation({ summary: 'Demande de location' })
  @ApiOkResponse({
    description: 'Demande de location envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async createApplication(@Body() data: ApplicationDto) {
    return this.rentalService.createApplication(data);
  }

  @Get(API_URL.APPLICATION.AGENCY_APPLICATION_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des demandes' })
  @ApiOkResponse({
    description: 'Liste reçu avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async agencyRequestList(
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
    @Query('initialPage') initialPage: number,
    @Query('limitPerPage') limitPerPage: number,
  ) {
    const page = convertToInteger(initialPage) || 1;
    const limit = convertToInteger(limitPerPage) || 10;
    return this.rentalService.getAllApplicationsByAgency(
      agencyId,
      ownerId,
      page,
      limit,
    );
  }

  @Get(API_URL.APPLICATION.USER_APPLICATION_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async getAllUserApplications(@Query('userId') userId: string) {
    return this.rentalService.getAllApplicationsByUser(userId);
  }
}
