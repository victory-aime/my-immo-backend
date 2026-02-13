import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class createAgencyOwnerDto {
  @ApiProperty({ example: 'NANA Beauty Salon' })
  name: string;

  @ApiProperty({ example: '123 Avenue Habib Bourguiba' })
  address: string;

  @ApiProperty({ example: 'Professional hair salon for women' })
  description: string;

  @ApiProperty({ example: 'Tunis' })
  city: string;

  @ApiProperty({ example: '+21698765432' })
  phone: string;

  @ApiProperty({
    example: 'https://cdn.app.com/salon-cover.jpg',
    description: "Logo de l'agence",
  })
  agencyLogo: string;

  @ApiProperty({
    example: 'A812uidbcxllf',
    description: "L'identifiant de l'utilisateur",
  })
  userId: string;

  @ApiProperty({
    description: "Listes des documents pour valider l'identité",
  })
  documents: string[];

  @ApiProperty({
    description: "Accepter les terms d'utilisation",
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  acceptTerms: boolean;
}

export class updateAgencyDto extends createAgencyOwnerDto {
  @ApiProperty({
    example: '12GYgZIZ',
    description: "L'identifiant de l'agence",
  })
  @IsString()
  agencyId: string;
}
