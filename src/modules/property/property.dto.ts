import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';
import { PropertyType } from '_prisma/enums';

export class propertyDto {
  @ApiProperty({
    description: 'Identifiant unique de la propriété',
    example: 'ckx123abc',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Identifiant de l’agence à laquelle la propriété appartient',
    example: 'ckx456def',
  })
  @IsString()
  propertyAgenceId: string;

  @ApiProperty({
    description: 'Titre de la propriété',
    example: 'Appartement moderne avec vue sur la mer',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL des images de la propriété',
    example: 'https://example.com/images/property-cover.jpg',
  })
  galleryImages: string[];

  @ApiProperty({
    description: 'Description détaillée de la propriété',
    example:
      'Cet appartement moderne offre une vue imprenable sur la mer, avec 3 chambres, 2 salles de bain, et une cuisine entièrement équipée.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type de la propriété',
    example: 'APARTMENT',
    enum: PropertyType,
  })
  type: PropertyType;

  @ApiProperty({
    description: 'Prix de la propriété en FCFA',
    example: 250000,
  })
  price: number;

  @ApiProperty({
    description: 'Surface de la propriété en mètres carrés',
    example: 120,
  })
  surface: number;

  @ApiProperty({
    description: 'Nombre de chambres de la propriété',
    example: 3,
  })
  rooms: number;

  @ApiProperty({
    description: 'Adresse de la propriété',
    example: '123 Rue de la Plage, Dakar, Sénégal',
  })
  address: string;

  @ApiProperty({
    description: 'Ville où se situe la propriété',
    example: 'Dakar',
  })
  city: string;

  @ApiProperty({
    description: 'Pays où se situe la propriété',
    example: 'Sénégal',
  })
  country: string;
}
