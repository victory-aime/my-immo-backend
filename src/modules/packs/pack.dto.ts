import { Plan } from '../../../prisma/generated/enums';

export class PlanFeatureInput {
  featureId: string;
  enabled: boolean;
  limit?: number | null;
}

export class CreatePlanInput {
  name: Plan;
  commissionRate: number;
  isActive?: boolean;
  features: PlanFeatureInput[];
}

export class UpdatePlanInput {
  commissionRate?: number;

  isActive?: boolean;
  features?: PlanFeatureInput[];
}
