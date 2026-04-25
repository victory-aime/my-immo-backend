import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { BillingCycle, Plan } from '../../../prisma/generated/enums';

export class createAgencyOwnerDto {
  @IsString()
  @ApiProperty({ example: 'NANA Beauty Salon' })
  name: string;

  @IsEmail()
  @ApiProperty({ example: 'NANA Beauty Salon' })
  email: string;

  @IsString()
  @ApiProperty({ example: '123 Avenue Habib Bourguiba' })
  address: string;

  @IsString()
  @ApiProperty({ example: 'Professional hair salon for women' })
  phone: string;

  @IsString()
  @ApiProperty({ example: 'Professional hair salon for women' })
  description: string;

  @ApiProperty({
    description: "Accepter les terms d'utilisation",
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  acceptTerms: boolean;

  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({
    description: "Listes des documents pour valider l'identité",
  })
  documents?: string[];

  // ✅ Plan choisi à l'onboarding (BASIC par défaut)
  @IsObject()
  plan: {
    planId: string;
    billingCycle: BillingCycle;
  };

  @IsEmail()
  userEmail: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(12)
  password: string;
}

export class updateAgencyDto extends createAgencyOwnerDto {
  @IsUUID()
  agencyId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  agencyLogo?: string;
}
