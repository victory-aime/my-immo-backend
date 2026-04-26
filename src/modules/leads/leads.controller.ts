import { Body, Controller, Delete, Get, Post, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { API_URL } from '_root/config/api';
import { LeadsService } from './leads.service';
import { AssignLeadDto, CreateLeadDto, UpdateLeadStatusDto } from './leads.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // ─────────────────────────────────────────────────────────────────
  // POST v1/secure/leads/create
  // ─────────────────────────────────────────────────────────────────
  @Post(API_URL.LEADS.CREATE)
  @AllowAnonymous()
  @ApiOperation({ summary: 'Créer une demande de contact (client connecté)' })
  @ApiBody({ type: CreateLeadDto })
  @ApiOkResponse({ description: 'Demande de contact créée avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async createLead(@Body() dto: CreateLeadDto, @Query('userId') userId: string) {
    return this.leadsService.createLead(dto, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET v1/secure/leads/my-leads
  // ─────────────────────────────────────────────────────────────────
  @Get(API_URL.LEADS.MY_LEADS)
  @ApiOperation({ summary: 'Voir mes demandes de contact (client connecté)' })
  @ApiOkResponse({ description: 'Liste de mes leads récupérée avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async getMyLeads(@Query('userId') userId: string) {
    return this.leadsService.getMyLeads(userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET v1/secure/leads/agency-leads?agencyId=xxx
  // ─────────────────────────────────────────────────────────────────
  @Get(API_URL.LEADS.AGENCY_LEADS)
  @ApiOperation({ summary: "Lister les leads d'une agence (Owner + Staff)" })
  @ApiOkResponse({ description: 'Liste des leads récupérée avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async getLeadsByAgency(@Query('agencyId') agencyId: string, @Query('userId') userId: string) {
    return this.leadsService.getLeadsByAgency(agencyId, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET v1/secure/leads/detail?leadId=xxx
  // ─────────────────────────────────────────────────────────────────
  @Get(API_URL.LEADS.LEAD_DETAIL)
  @ApiOperation({ summary: "Détail d'un lead" })
  @ApiOkResponse({ description: 'Lead récupéré avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async getLeadById(
    @Query('leadId') leadId: string,
    @Query('userId') userId: string,
    @Query('agencyId') agencyId: string,
  ) {
    return this.leadsService.getLeadById(leadId, agencyId, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH v1/secure/leads/update-status?leadId=xxx
  // ─────────────────────────────────────────────────────────────────
  @Patch(API_URL.LEADS.UPDATE_STATUS)
  @ApiOperation({ summary: 'Mettre à jour le statut du lead (pipeline CRM)' })
  @ApiBody({ type: UpdateLeadStatusDto })
  @ApiOkResponse({ description: 'Statut mis à jour avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async updateLeadStatus(@Body() dto: UpdateLeadStatusDto) {
    return this.leadsService.updateLeadStatus(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // PATCH v1/secure/leads/assign?leadId=xxx
  // ─────────────────────────────────────────────────────────────────
  @Patch(API_URL.LEADS.ASSIGN)
  @ApiOperation({ summary: 'Assigner un agent au lead (Owner + Admin agence)' })
  @ApiBody({ type: AssignLeadDto })
  @ApiOkResponse({ description: 'Agent assigné avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async assignLead(@Body() dto: AssignLeadDto) {
    return this.leadsService.assignLead(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE v1/secure/leads/delete?leadId=xxx
  // ─────────────────────────────────────────────────────────────────
  @Delete(API_URL.LEADS.DELETE)
  @ApiOperation({ summary: 'Supprimer un lead (Owner + Admin agence)' })
  @ApiOkResponse({ description: 'Lead supprimé avec succès' })
  @ApiBadRequestResponse({ description: 'Une erreur est survenue' })
  async deleteLead(
    @Query('leadId') leadId: string,
    @Query('userId') userId: string,
    @Query('agencyId') agencyId: string,
  ) {
    return this.leadsService.deleteLead(leadId, userId, agencyId);
  }
}
