import { AgencyRole } from '../../../prisma/generated/enums';

export class CreateInvitationDto {
  adminId: string;
  userId: string;
  agencyId: string;
  payload: {
    name: string;
    email: string;
    role: AgencyRole;
    temporaryPassword: string;
    permissions: { permissionId: string; granted: boolean }[];
  };
}
