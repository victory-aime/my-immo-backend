// src/modules/users/admin-users.controller.ts

import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AllowAnonymous, AuthGuard } from '@thallesp/nestjs-better-auth';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { UsersAdminService } from './users-admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { API_URL } from '_root/config/api';
import { Role } from '../../../prisma/generated/enums';
import { convertToInteger } from '_root/config/convert';

@ApiTags('Super Admin - Utilisateurs')
@ApiBearerAuth()
@Controller()
@AllowAnonymous() // ← retirer avant la PR
//@UseGuards(AuthGuard, MiddlewareGuard)
export class AdminUsersController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  // GET /api/v1/secure/admin/users
  @Get(API_URL.USER_ADMIN.LIST)
  @AuthorizeRoles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Lister tous les utilisateurs',
    description:
      'Retourne la liste paginée de tous les utilisateurs avec filtrage optionnel par rôle.',
  })
  @ApiQuery({ name: 'initialPage', required: false, example: 1 })
  @ApiQuery({ name: 'limitPerPage', required: false, example: 10 })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtrer par rôle',
  })
  @ApiOkResponse({ description: 'Liste des utilisateurs récupérée avec succès' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer manquant ou invalide' })
  async getAllUsers(
    @Query('initialPage') initialPage: number,
    @Query('limitPerPage') limitPerPage: number,
    @Query('role') role?: Role,
  ) {
    const page = convertToInteger(initialPage) || 1;
    const limit = convertToInteger(limitPerPage) || 10;
    return this.usersAdminService.getAllUsers({ page, limit, role });
  }

  // PATCH /api/v1/secure/admin/users//status
  @Patch(API_URL.USER_ADMIN.UPDATE_STATUS)
  @AuthorizeRoles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Bloquer ou débloquer un utilisateur',
    description:
      "Permet au SUPER_ADMIN de changer le statut d'un utilisateur : ACTIVE, INACTIVE ou BANNED.",
  })
  @ApiQuery({ name: 'id', description: "Identifiant de l'utilisateur" })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkResponse({ description: 'Statut mis à jour avec succès' })
  @ApiBadRequestResponse({ description: 'Utilisateur introuvable ou statut invalide' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer manquant ou invalide' })
  async updateUserStatus(@Query('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersAdminService.updateUserStatus(id, dto.status);
  }
}
