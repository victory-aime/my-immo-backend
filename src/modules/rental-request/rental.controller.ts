import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { RentalService } from './rental.service';
import { RentalDto } from './rental.dto';

@Controller()
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post(API_URL.RENTAL_REQUESTS.CREATE)
  @ApiBody({ type: RentalDto })
  @ApiOperation({ summary: 'Demande de location' })
  @ApiOkResponse({
    description: 'Demande de location envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async rentalRequest(@Body() data: RentalDto) {
    return this.rentalService.createRentalRequest(data);
  }

  @Get(API_URL.RENTAL_REQUESTS.RENTAL_REQUESTS_AGENCY_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des demandes' })
  @ApiOkResponse({
    description: 'Liste reçu avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async agencyRequestList(@Query('agencyId') agencyId: string) {
    return this.rentalService.getRentalRequestByAgency(agencyId);
  }

  @Get(API_URL.RENTAL_REQUESTS.RENTAL_REQUESTS_USER_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async readAllRequest(@Query('userId') userId: string) {
    return this.rentalService.getRentalRequestByUser(userId);
  }
}
