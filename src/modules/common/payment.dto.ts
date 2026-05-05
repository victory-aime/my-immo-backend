// src/payment/dto/initiate-agency-payment.dto.ts
// Reprend exactement les champs de createAgencyOwnerDto
// mais sans déclencher la création — on initie seulement le paiement.

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BillingCycle } from '../../../prisma/generated/enums';
import { createAgencyOwnerDto } from '_root/modules/agency/agency.dto';

class PlanSelectionDto {
  @IsString()
  planId: string;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}

export class InitiateAgencyPaymentDto extends createAgencyOwnerDto {}
