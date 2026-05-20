import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnonceStatus } from '../../../prisma/generated/enums';

export class CreateAnnonceDto {
  @ApiProperty({ example: 'Appartement F3 Almadies', description: 'Titre de l\'annonce' })
  title: string;

  @ApiProperty({ example: 'uuid-de-la-propriete', description: 'Identifiant de la propriété concernée' })
  propertyId: string;

  @ApiProperty({ example: 'Bel appartement lumineux avec vue sur mer...', description: 'Description détaillée de l\'annonce' })
  description: string;

  @ApiProperty({
    example: ['https://res.cloudinary.com/example/img1.jpg'],
    description: 'URLs des images de la galerie (injectées après upload)',
    type: [String],
  })
  galleryImages: string[];

  @ApiPropertyOptional({ example: 'uuid-de-l-agence', description: "Identifiant de l'agence publiant l'annonce" })
  agencyId?: string;

  @ApiPropertyOptional({ enum: AnnonceStatus, example: 'ACTIVE', description: 'Statut de l\'annonce' })
  status?: AnnonceStatus;
}

export class UpdateAnnonceDto extends CreateAnnonceDto {
  @ApiProperty({ example: 'uuid-de-l-annonce', description: 'Identifiant de l\'annonce à modifier' })
  id: string;
}
