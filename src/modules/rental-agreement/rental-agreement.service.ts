import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '../../config/http.error';
import { IRentalAgreementResponseDto } from './rental-agreement.dto';
import { AgencyService } from '_root/modules/agency/agency.service';

@Injectable()
export class RentalAgreementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyService: AgencyService,
  ) {}

  /**
   * APPROVE RENTAL REQUEST
   */
  async approveRentalRequest(
    requestId: string,
    agencyId: string,
    ownerId: string,
  ) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rentalRequest.findUnique({
        where: { id: requestId },
        include: { property: true },
      });

      if (!request)
        throw new HttpError(
          'Rental request not found',
          HttpStatus.NOT_FOUND,
          'RENTAL_REQUEST_NOT_FOUND',
        );

      if (request.property.propertyAgenceId !== agencyId)
        throw new HttpError(
          'Unauthorized access to this property',
          HttpStatus.FORBIDDEN,
          'UNAUTHORIZED_PROPERTY_ACCESS',
        );

      if (request.property.status !== 'AVAILABLE')
        throw new HttpError(
          'Property is not available',
          HttpStatus.BAD_REQUEST,
          'PROPERTY_NOT_AVAILABLE',
        );

      const existingLease = await tx.rentalAgreement.findUnique({
        where: { propertyId: request.propertyId },
      });

      if (existingLease)
        throw new HttpError(
          'Property already rented',
          HttpStatus.BAD_REQUEST,
          'PROPERTY_ALREADY_RENTED',
        );

      await tx.rentalAgreement.create({
        data: {
          propertyId: request.propertyId,
          tenantId: request.tenantId,
          rentAmount: request.property.price,
        },
      });

      await tx.property.update({
        where: { id: request.propertyId },
        data: { status: 'RENTED' },
      });

      await tx.rentalRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      await tx.rentalRequest.updateMany({
        where: {
          propertyId: request.propertyId,
          NOT: { id: requestId },
        },
        data: { status: 'REJECTED' },
      });

      return {
        success: true,
        message: 'Rental request approved successfully',
      };
    });
  }

  /**
   * REJECT RENTAL REQUEST
   */
  async rejectRentalRequest(
    requestId: string,
    agencyId: string,
    ownerId: string,
  ) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);
    const request = await this.prisma.rentalRequest.findUnique({
      where: { id: requestId },
      include: { property: true },
    });

    if (!request)
      throw new HttpError(
        'Rental request not found',
        HttpStatus.NOT_FOUND,
        'RENTAL_REQUEST_NOT_FOUND',
      );

    if (request.property.propertyAgenceId !== agencyId)
      throw new HttpError(
        'Unauthorized',
        HttpStatus.FORBIDDEN,
        'UNAUTHORIZED_PROPERTY_ACCESS',
      );

    if (request.status !== 'PENDING')
      throw new HttpError(
        'Request already processed',
        HttpStatus.BAD_REQUEST,
        'RENTAL_REQUEST_ALREADY_PROCESSED',
      );

    await this.prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return {
      success: true,
      message: 'Rental request rejected successfully',
    };
  }

  /**
   * TERMINATE LEASE
   */
  async terminateLease(propertyId: string, agencyId: string, ownerId: string) {
    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);
    return this.prisma.$transaction(async (tx) => {
      const lease = await tx.rentalAgreement.findUnique({
        where: { propertyId },
        include: { property: true },
      });

      if (!lease)
        throw new HttpError(
          'Lease not found',
          HttpStatus.NOT_FOUND,
          'LEASE_NOT_FOUND',
        );

      if (lease.property.propertyAgenceId !== agencyId)
        throw new HttpError(
          'Unauthorized',
          HttpStatus.FORBIDDEN,
          'UNAUTHORIZED_PROPERTY_ACCESS',
        );

      await tx.rentalAgreement.update({
        where: { propertyId },
        data: { status: 'TERMINATED' },
      });

      await tx.property.update({
        where: { id: propertyId },
        data: { status: 'AVAILABLE' },
      });

      return {
        success: true,
        message: 'Lease terminated successfully',
      };
    });
  }

  async getRentalAgreementListByAgency(
    agencyId: string,
    ownerId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    content: IRentalAgreementResponseDto[];
    totalDataPerPage: number;
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    const pageInitial = page || 1;
    const limitPage = limit || 10;

    const skip = (pageInitial - 1) * limitPage;

    await this.agencyService.checkAgencyOwnership(ownerId, agencyId);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rentalAgreement.findMany({
        where: {
          property: { propertyAgenceId: agencyId },
        },
        include: { tenant: true, property: true },

        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.rentalAgreement.count({
        where: {
          property: { propertyAgenceId: agencyId },
        },
      }),
    ]);
    const response = data?.map((data) => ({
      id: data.id,
      tenant: data.tenant
        ? {
            id: data.tenantId,
            name: data.tenant.name,
            email: data.tenant.email ?? undefined, // <-- null → undefined
            image: data.tenant.image ?? undefined, // <-- null → undefined
            status: data.tenant.status,
          }
        : null,
      rentAmount: data.rentAmount?.toNumber().toString(), // si ton DTO attend string
      property: {
        title: data.property?.title,
      },
      status: data.status,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate?.toISOString(),
    }));

    return {
      content: response,
      totalDataPerPage: limitPage,
      totalItems: total,
      currentPage: pageInitial,
      totalPages: Math.ceil(total / limitPage),
    };
  }
}
