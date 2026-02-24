import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @ApiProperty({
    description: 'Nom complet',
    example: 'john doe',
  })
  fullName: string;

  @IsEmail()
  @ApiProperty({
    description: 'Nom complet',
    example: 'john@doe.com',
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'Nom complet',
    example: '14521212122',
  })
  phone: string;

  @IsString()
  @ApiProperty({
    description: 'Sujet',
    example: 'john doe',
  })
  subject: string;

  @IsString()
  @ApiProperty({
    description: 'Message',
    example: 'john doe',
  })
  message: string;

  @IsString()
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: "Identifiant de l'utilisateur",
    example: 'AZ2324EZEdgysz',
  })
  userId: string;

  @IsString()
  @IsUUID()
  @ApiProperty({
    description: 'Identifiant de la propriete',
    example: 'AZ2324EZEdgysz',
  })
  propertyId: string;

  @IsString()
  @IsUUID()
  @ApiProperty({
    description: "Identifiant de l'agence",
    example: 'AZ2324EZEdgysz',
  })
  agencyId: string;
}
