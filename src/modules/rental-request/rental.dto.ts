import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RentalDto {
  @IsString()
  @ApiProperty({})
  propertyId: string;

  @IsString()
  @ApiProperty({})
  tenantId: string;

  @IsString()
  @ApiProperty({})
  phone?: string;

  @IsString()
  @ApiProperty({})
  message?: string;
}
