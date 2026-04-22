import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeadStatus } from '../../../prisma/generated/enums';

// ─── 1. Créer un lead (client connecté uniquement) ────────────────
export class CreateLeadDto {
  @ApiProperty({
    example: 'uuid-de-la-propriete',
    description: 'UUID du bien immobilier concerné',
  })
  @IsUUID()
  propertyId: string;

  @ApiPropertyOptional({
    example: 'Je suis intéressé par cet appartement, je voudrais visiter',
    description: 'Message optionnel du client',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

// ─── 2. Changer le statut du lead (pipeline CRM) ─────────────────
export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: LeadStatus,
    example: LeadStatus.CONTACTED,
    description: `Pipeline CRM :
    NEW           → lead reçu
    CONTACTED     → client contacté
    VISIT_PLANNED → visite planifiée
    OFFER         → offre faite
    CONVERTED     → converti en locataire`,
  })
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

// ─── 3. Assigner un agent au lead ────────────────────────────────
export class AssignLeadDto {
  @ApiProperty({
    example: 'uuid-du-staff',
    description: "UUID de l'agent à assigner au lead",
  })
  @IsUUID()
  staffId: string;
}

// ─── 4. Convertir un lead en locataire ───────────────────────────
export class ConvertToTenantDto {
  @ApiProperty({
    example: 'Ami Diallo',
    description: 'Nom complet du locataire',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'ami@email.com',
    description: 'Email du locataire',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+221 77 000 00 00',
    description: 'Téléphone du locataire',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: ['https://cloudinary.com/cni.pdf'],
    description: 'URLs des documents du locataire (CNI, justificatifs...)',
  })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];
}
