import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AgencyAdminService } from './agency-admin.service';
import { UpdateAgencyStatusDto } from './dto/update-agency-status.dto';
import { API_URL } from '_root/config/api';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('Super Admin - Agences')
@Controller()
@AllowAnonymous()
@ApiBearerAuth()
export class AdminAgencyController {
  constructor(private readonly agencyAdminService: AgencyAdminService) {}

  // GET  — liste toutes les agences
  @Get(API_URL.AGENCY_ADMIN.LIST)
  @ApiOperation({
    summary: 'Lister toutes les agences',
    description:
      'Retourne la liste complète des agences avec leurs owners et abonnements. Réservé au SUPER_ADMIN.',
  })
  @ApiOkResponse({ description: 'Liste des agences récupérée avec succès' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer manquant ou invalide' })
  async getAllAgencies() {
    return this.agencyAdminService.getAllAgencies();
  }

  // GET  — détail d'une agence par ID
  @Get(API_URL.AGENCY_ADMIN.DETAIL)
  @ApiOperation({
    summary: "Détail complet d'une agence",
    description:
      "Retourne toutes les informations d'une agence (owner, staff, abonnement) via son ID.",
  })
  @ApiParam({ name: 'id', description: "Identifiant UUID de l'agence" })
  @ApiOkResponse({ description: "Détail de l'agence récupéré avec succès" })
  @ApiBadRequestResponse({ description: 'Agence introuvable' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer manquant ou invalide' })
  async getAgencyById(@Param('id') id: string) {
    return this.agencyAdminService.getAgencyById(id);
  }

  // PATCH — changer le statut d'une agence
  @Patch(API_URL.AGENCY_ADMIN.UPDATE_STATUS)
  @ApiOperation({
    summary: 'Valider ou suspendre une agence',
    description:
      "Permet au SUPER_ADMIN de changer le statut d'une agence : PENDING → OPEN (validation) ou OPEN → CLOSE (suspension).",
  })
  @ApiParam({ name: 'id', description: "Identifiant UUID de l'agence" })
  @ApiBody({ type: UpdateAgencyStatusDto })
  @ApiOkResponse({ description: 'Statut mis à jour avec succès' })
  @ApiBadRequestResponse({ description: 'Agence introuvable ou statut invalide' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer manquant ou invalide' })
  async updateAgencyStatus(@Param('id') id: string, @Body() dto: UpdateAgencyStatusDto) {
    return this.agencyAdminService.updateAgencyStatus(id, dto.status);
  }
}
