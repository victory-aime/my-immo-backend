import { ApiProperty } from '@nestjs/swagger';
import { BatimentStatus } from '../../../prisma/generated/enums';
import { IPaginationDto } from '_root/config/pagination.dto';

export class CreateBuildingDto {
  name: string;
  address: string;
  city: string;
  district?: string;
  description?: string;
  floors?: number;
  buildingOwner: string;
  status: BatimentStatus;

  @ApiProperty({
    description: 'URL des documents du bâtiment',
    example: 'https://example.com/images/property-cover.jpg',
  })
  documents: string[];
  agencyId: string;
  landId?: string;
}

export class UpdateBuildingDto extends CreateBuildingDto {
  id: string;
}

export class BuildingFilterDto extends IPaginationDto {
  name: string;
  city: string;
  district: string;
  status: BatimentStatus;
}
