import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InvitationService } from '_root/modules/invitations/invitation.service';
import { AgencyRole, Role } from '../../../prisma/generated/enums';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { AllowAnonymous, AuthGuard } from '@thallesp/nestjs-better-auth';
import { API_URL } from '_root/config/api';
import { CreateInvitationDto } from '_root/modules/invitations/invitation.dto';

@Controller()
@UseGuards(AuthGuard, MiddlewareGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get(API_URL.INVITATION.AGENCY_INVITE_LIST)
  async AllAgencyInviteList(@Query('agencyId') agencyId: string) {
    return this.invitationService.getAllInviteByAgencyId(agencyId);
  }

  @Post(API_URL.INVITATION.CREATE_INVITE)
  @AuthorizeRoles(Role.OWNER, Role.AGENCY_ADMIN)
  async createInvitation(
    @Body()
    data: CreateInvitationDto,
  ) {
    return this.invitationService.createInvitation(data);
  }

  @Post(API_URL.INVITATION.ACCEPT_INVITE)
  @AllowAnonymous()
  async acceptInvitation(@Query('token') token: string) {
    return this.invitationService.acceptInvitation(token);
  }

  @Post(API_URL.INVITATION.CANCEL_INVITE)
  @AuthorizeRoles(Role.OWNER, Role.AGENCY_ADMIN)
  async cancelInvitation(@Query('inviteId') inviteId: string) {
    return this.invitationService.cancelledInvitation(inviteId);
  }
}
