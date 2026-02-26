import { Controller, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { RentalAgreementService } from './rental-agreement.service';

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
  ) {
    return this.rentalAgreementService.approveRentalRequest(
      requestId,
      agencyId,
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
  ) {
    return this.rentalAgreementService.rejectRentalRequest(requestId, agencyId);
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
  ) {
    return this.rentalAgreementService.terminateLease(propertyId, agencyId);
  }
}
