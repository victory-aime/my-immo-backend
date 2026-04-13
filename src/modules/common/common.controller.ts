import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from '_root/modules/common/services/permissions.service';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '../../../prisma/generated/enums';
import { API_URL } from '_root/config/api';

@Controller()
@UseGuards(AuthGuard, MiddlewareGuard)
export class CommonController {
  constructor(private readonly permissionService: PermissionsService) {}

  @Get(API_URL.COMMON.PERMS)
  @AuthorizeRoles(Role.AGENCY_ADMIN, Role.OWNER)
  async getAllPerms(@Query('agencyId') agencyId: string) {
    return this.permissionService.getAssignableFeatures(agencyId);
  }
}
