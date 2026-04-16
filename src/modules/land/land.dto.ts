import { LandPaymentType, LandStatus } from '../../../prisma/generated/enums';
import { IPaginationDto } from '_root/config/pagination.dto';

export class LandDto {
  title: string;
  purchasePrice: number;
  area: number;
  city: string;
  district?: string;
  landOwner?: string;
  status: LandStatus;
  paymentType: LandPaymentType;
  documents: string[];
  agencyId: string;
}

export class CreateLandDto extends LandDto {
  ownerId: string;
}

export class UpdateLandDto extends LandDto {
  id: string;
  ownerId: string;
}

export class LandResponseDto extends LandDto {
  id: string;
  batiments: any[];
}

export interface LandFilterDto extends IPaginationDto, LandDto {}
