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
  @Post(API_URL.CONTACT.PUBLIC_CONTACT)
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

  @Get(API_URL.CONTACT.AGENCY_CONTACT_LIST)
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
  ) {
    return this.contactService.getAgencyContactList(agencyId, ownerId);
  }

  @Post(API_URL.CONTACT.AGENCY_CONTACT_UPDATE_STATUS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre a jour une demandes' })
  @ApiOkResponse({
    description: 'Mise a jour faite avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async updateRequestStatus(
    @Query('requestId') requestId: string,
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.contactService.updateAgencyContactStatus(
      requestId,
      agencyId,
      ownerId,
    );
  }

  @Post(API_URL.CONTACT.AGENCY_CONTACT_READ_ALL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lire toutes les demandes' })
  @ApiOkResponse({
    description: 'Toutes les demandes ont été lues avec success',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async readAllRequest(
    @Query('agencyId') agencyId: string,
    @Query('ownerId') ownerId: string,
  ) {
    return this.contactService.markAllAsRead(agencyId, ownerId);
  }
}
