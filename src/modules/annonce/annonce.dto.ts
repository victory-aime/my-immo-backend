import { AnnonceStatus } from '../../../prisma/generated/enums';

export class CreateAnnonceDto {
  title: string;
  propertyId: string;
  description: string;
  galleryImages: string[];
  agencyId?: string;
  userId?: string;
  status?: AnnonceStatus;
}

export class UpdateAnnonceDto extends CreateAnnonceDto {
  id: string;
}
