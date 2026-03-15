import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { RentalAgreementService } from './rental-agreement.service';
import { convertToInteger } from '_root/config/convert';

@Controller()
export class RentalAgreementController {
  constructor(
    private readonly rentalAgreementService: RentalAgreementService,
  ) {}

  @Post(API_URL.RENTAL_AGREEMENT.APPROVE)
  @ApiBody({})
  @ApiOperation({ summary: 'Demande de location' })
  @ApiOkResponse({
    description: 'Demande de location envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async approveRentalAgreement(
    @Query('requestId') requestId: string,
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.rentalAgreementService.approveRentalRequest(
      requestId,
      agencyId,
      ownerId,
    );
  }

  @Post(API_URL.RENTAL_AGREEMENT.REJECT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des demandes' })
  @ApiOkResponse({
    description: 'Liste reçu avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async rejectRentalAgreement(
    @Query('requestId') requestId: string,
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.rentalAgreementService.rejectRentalRequest(
      requestId,
      agencyId,
      ownerId,
    );
  }

  @Post(API_URL.RENTAL_AGREEMENT.CLOSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async terminateLease(
    @Query('propertyId') propertyId: string,
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.rentalAgreementService.terminateLease(
      propertyId,
      agencyId,
      ownerId,
    );
  }

  @Get(API_URL.RENTAL_AGREEMENT.AGENCY_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async getRentalAgreementAgencyList(
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
    @Query('initialPage') initialPage: number,
    @Query('limitPerPage') limitPerPage: number,
  ) {
    const page = convertToInteger(initialPage) || 1;
    const limit = convertToInteger(limitPerPage) || 10;
    return this.rentalAgreementService.getRentalAgreementListByAgency(
      agencyId,
      ownerId,
      page,
      limit,
    );
  }
}
