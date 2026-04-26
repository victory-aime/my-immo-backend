import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { API_URL } from '_root/config/api';
import { TeamService } from '_root/modules/team/team.service';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '../../../prisma/generated/enums';

@Controller()
@UseGuards(AuthGuard, MiddlewareGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get(API_URL.TEAM.AGENCY_TEAM_LIST)
  @AuthorizeRoles(Role.OWNER)
  async getAllTeamsByAgency(@Query('agencyId') agencyId: string, @Query('userId') userId: string) {
    return this.teamService.getTeamListByAgencyId(agencyId, userId);
  }

  @Post(API_URL.TEAM.CHANGE_STATUS)
  @AuthorizeRoles(Role.OWNER)
  async enabledOrDisabled(
    @Query('id') id: string,
    @Query('userId') userId: string,
    @Body() data: { status: boolean },
  ) {
    return this.teamService.enableOrDisabledAccount(id, userId, data.status);
  }
}
