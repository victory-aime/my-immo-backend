import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '_root/database/prisma.service';
import { HttpError } from '../../config/http.error';

@Injectable()
export class RentalAgreementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * APPROVE RENTAL REQUEST
   */
  async approveRentalRequest(requestId: string, agencyId: string) {
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
  async rejectRentalRequest(requestId: string, agencyId: string) {
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
  async terminateLease(propertyId: string, agencyId: string) {
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
}
