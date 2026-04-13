import { Injectable } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { AgencyRole } from '../../../prisma/generated/enums';
import { getAuthInstance } from '_root/lib/auth';
import { decryptPassword, encryptPassword } from '_root/config/crypto';

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  // invitation.service.ts

  async createInvitation(
    adminUserId: string,
    agencyId: string,
    dto: {
      name: string;
      temporaryPassword: string;
      email: string;
      role: AgencyRole;
      permissions: { permissionId: string; granted: boolean }[];
    },
  ) {
    // 1. Vérifier que l'admin appartient bien à l'agence
    const admin = await this.prisma.staff.findFirstOrThrow({
      where: { userId: adminUserId, agencyId, agencyRole: 'AGENCY_ADMIN' },
    });

    // 2. Récupérer les features accessibles par le plan de l'agence
    const agencyPlanFeatures = await this.prisma.planFeature.findMany({
      where: {
        enabled: true,
        plan: {
          subscriptions: { some: { agencyId, status: 'ACTIVE' } },
        },
      },
      select: { featureId: true },
    });

    const allowedFeatureIds = new Set(
      agencyPlanFeatures.map((f) => f.featureId),
    );

    // 3. Valider que les permissions demandées sont dans le plan
    const invalidPerms = dto.permissions.filter(
      (p) => !allowedFeatureIds.has(p.permissionId),
    );
    if (invalidPerms.length > 0) {
      throw new Error(`Ces features ne sont pas incluses dans votre plan.`);
    }

    // 4. Créer l'invitation avec les permissions pré-configurées
    // 5. Envoyer l'email avec le token
    //await sendInvitationEmail(dto.email, invitation.token);

    return this.prisma.invitation.create({
      data: {
        name: dto.name,
        email: dto.email,
        temporaryPassword: encryptPassword(dto.temporaryPassword),
        agencyId,
        agencyRole: dto.role,
        invitedBy: adminUserId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        permissions: {
          create: dto.permissions.map((p) => ({
            permissionId: p.permissionId,
            granted: p.granted,
          })),
        },
      },
      include: { permissions: true },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    // 1. Valider le token
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { token },
      include: { permissions: true },
    });

    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation déjà utilisée ou annulée.');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Invitation expirée.');
    }

    // 2. Vérifier que le plan autorise toujours ces features
    //    (le plan peut avoir changé entre l'invite et l'acceptation)
    const currentPlanFeatures = await this.prisma.planFeature.findMany({
      where: {
        enabled: true,
        plan: {
          subscriptions: {
            some: { agencyId: invitation.agencyId, status: 'ACTIVE' },
          },
        },
      },
      select: { featureId: true },
    });
    const currentAllowed = new Set(currentPlanFeatures.map((f) => f.featureId));

    // 3. Créer le Staff + ses permissions dans une transaction
    return this.prisma.$transaction(async (tx) => {
      const auth = getAuthInstance();
      const { user } = await auth.api.signUpEmail({
        body: {
          email: invitation.email,
          password: decryptPassword(invitation.temporaryPassword),
          name: invitation.name,
        },
      });
      const newStaff = await tx.staff.create({
        data: {
          userId: user?.id,
          agencyId: invitation.agencyId,
          agencyRole: invitation.agencyRole,
        },
      });

      // Filtrer les permissions encore valides selon le plan actuel
      const validPermissions = invitation.permissions.filter((p) =>
        currentAllowed.has(p.permissionId ?? ''),
      );

      await tx.staffPermission.createMany({
        data: validPermissions.map((p) => ({
          staffId: newStaff.id,
          permissionId: p.permissionId,
          granted: p.granted,
          grantedBy: invitation.invitedBy,
        })),
      });

      // Marquer l'invitation comme acceptée
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return newStaff;
    });
  }
}
