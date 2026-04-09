import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { API_URL } from '_root/config/api';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { propertyDto, PropertyFilterDto } from './property.dto';
import { PropertyService } from './property.service';
import { convertToInteger } from '_root/config/convert';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Throttle } from '@nestjs/throttler';

@Controller()
@ApiBearerAuth()
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Get(API_URL.PROPERTY.ALL_PROPERTIES_BY_AGENCY)
  @ApiOperation({ summary: 'Récupérer toutes les propriétés' })
  @ApiOkResponse({
    description: 'Liste des propriétés récupérée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async allProperties(@Query() data: PropertyFilterDto) {
    return this.propertyService.getAllPropertyByAgency(data);
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
    return this.propertyService.getAllPublicProperties();
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
  async createProperty(
    @Body() data: propertyDto,
    @Query('ownerId') ownerId: string,
  ) {
    console.log('data', data);
    return this.propertyService.createProperty(ownerId, {
      ...data,
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
  async updateProperty(
    @Body() data: propertyDto,
    @Query('ownerId') ownerId: string,
    @Query('appartId') appartId: string,
  ) {
    return this.propertyService.updateProperty(ownerId, appartId, {
      ...data,
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

  // @Get(API_URL.PROPERTY.MONTHLY_REVENUE)
  // @ApiOperation({
  //   summary: 'Récupérer les revenues par propriétés actuellement fake API',
  // })
  // @ApiOkResponse({
  //   description: 'Stats envoyée avec success',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Une erreur est survenue réessayer plus tard',
  // })
  // async monthlyRevenue(
  //   @Query('ownerId') ownerId: string,
  //   @Query('agencyId') agencyId: string,
  // ) {
  //   return this.propertyService.getMonthlyRevenue(ownerId, agencyId);
  // }
}
