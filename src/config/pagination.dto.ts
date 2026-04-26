export class IPaginationDto {
  agencyId: string;
  ownerId?: string;
  userId: string;
  initialPage: number;
  limitPerPage: number;
}
