import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { CreateContactDto } from '_root/modules/contact/contact.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @AllowAnonymous()
  @Post(API_URL.CONTACT.PUBLIC_REQUEST)
  @ApiBody({ type: CreateContactDto })
  @ApiOperation({ summary: 'Contactez une agence' })
  @ApiOkResponse({
    description: 'Demande envoyée avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async publicContactRequest(@Body() data: CreateContactDto) {
    return this.contactService.create(data);
  }

  @Get(API_URL.CONTACT.AGENCY_REQUEST_LIST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer la liste des demandes' })
  @ApiOkResponse({
    description: 'Liste reçu avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async agencyRequestList(@Query('agencyId') agencyId: string) {
    return this.contactService.getAgencyRequest(agencyId);
  }

  @Post(API_URL.CONTACT.CHANGE_REQUEST_STATUS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre a jour une demandes' })
  @ApiOkResponse({
    description: 'Mise a jour faite avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async updateRequestStatus(@Query('requestId') requestId: string) {
    return this.contactService.updateStatus(requestId, 'READ');
  }

  @Post(API_URL.CONTACT.READ_ALL_REQUESTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async readAllRequest(@Query('agencyId') agencyId: string) {
    return this.contactService.markAllAsRead(agencyId);
  }
}
