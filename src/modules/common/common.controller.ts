import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '_root/modules/common/services/permissions.service';
import { AuthorizeRoles, MiddlewareGuard } from '_root/guard/middleware.guard';
import { AllowAnonymous, AuthGuard } from '@thallesp/nestjs-better-auth';
import { Role } from '../../../prisma/generated/enums';
import { API_URL } from '_root/config/api';
import { CommonService } from '_root/modules/common/common.service';
import { PaymentService } from '_root/modules/common/services/payment.service';
import { NabooSignatureGuard } from '_root/guard/naboo.guard';

@Controller()
export class CommonController {
  private readonly logger = new Logger(CommonController.name);
  constructor(
    private readonly permissionService: PermissionsService,
    private readonly commonService: CommonService,
    private readonly paymentService: PaymentService,
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

  // ── POST /payment/initiate-agency ─────────────────────────────────────────
  /**
   * Appelé par Next.js lors de la soumission du formulaire d'onboarding.
   * Crée le compte BetterAuth + transaction NabooPay + snapshot en DB.
   * Retourne checkout_url → le frontend redirige vers NabooPay.
   *
   * Pas de guard auth ici : l'utilisateur n'est pas encore connecté.
   */
  // @Post('initiate-agency')
  // @HttpCode(HttpStatus.CREATED)
  // initiateAgencyPayment(@Body() dto: InitiateAgencyPaymentDto) {
  //   return this.paymentService.initiateAgencyPayment(dto);
  //   // → { checkout_url, order_id }
  // }

  // ── POST /payment/webhook ─────────────────────────────────────────────────
  /**
   * Endpoint NabooPay — URL à enregistrer sur platform.naboopay.com.
   * NabooSignatureGuard rejette toute requête sans signature HMAC valide.
   * Répond 200 immédiatement, traitement en fire-and-forget.
   */
  @AllowAnonymous()
  @Post('webhooks/naboo')
  @UseGuards(NabooSignatureGuard)
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() payload: any) {
    setImmediate(() => {
      this.paymentService.handleWebhook(payload).catch((err) => {
        this.logger.error('Erreur traitement webhook:', err.message, err.stack);
      });
    });
    return { received: true };
  }

  // ── GET /payment/:orderId/status ──────────────────────────────────────────
  /**
   * Polling fallback depuis Next.js (page /onboarding/success).
   * Vérifie le statut auprès de NabooPay et en base.
   */
  @AllowAnonymous()
  @Get(API_URL.COMMON.PAYMENT_POLLING)
  getPaymentStatus(@Query('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
    // → { order_id, local_status, naboo_status }
  }
}
