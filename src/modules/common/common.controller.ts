import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from '_root/modules/common/services/permissions.service';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { AllowAnonymous, AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '../../../prisma/generated/enums';
import { API_URL } from '_root/config/api';
import { CommonService } from '_root/modules/common/common.service';

@Controller()
export class CommonController {
  constructor(
    private readonly permissionService: PermissionsService,
    private readonly commonService: CommonService,
  ) {}

  @Get(API_URL.COMMON.PERMS)
  @UseGuards(AuthGuard, MiddlewareGuard)
  @AuthorizeRoles(Role.AGENCY_ADMIN, Role.OWNER)
  async getAllPerms(@Query('agencyId') agencyId: string) {
    return this.permissionService.getAssignableFeatures(agencyId);
  }

  @Get(API_URL.COMMON.PACKS)
  @AllowAnonymous()
  async getAllPacks() {
    return this.commonService.getAllPlans();
  }
}
