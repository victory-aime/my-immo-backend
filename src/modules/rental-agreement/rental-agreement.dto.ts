import {
  RentalAgreementStatus,
  UserStatus,
} from '../../../prisma/generated/enums';

export class IRentalAgreementResponseDto {
  id: string;
  tenant: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    status: UserStatus;
  } | null;
  rentAmount: string;
  property: {
    title: string;
  };
  status: RentalAgreementStatus;
  startDate: string;
  endDate?: string;
}
