// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { PrismaService } from '../../../config/services';
//
// @Injectable()
// export class OtpCleanupCronService {
//   private readonly logger = new Logger(OtpCleanupCronService.name);
//
//   constructor(private readonly prisma: PrismaService) {}
//
//   @Cron(CronExpression.EVERY_MINUTE)
//   async resetExpiredOtpBlocks() {
//     const now = new Date();
//
//     const expiredPolicies = await this.prisma.otpPolicy.findMany({
//       where: {
//         isBlocked: true,
//         blockUntil: {
//           lt: now,
//         },
//       },
//     });
//
//     if (expiredPolicies.length === 0) return;
//
//     const updates = expiredPolicies.map((policy) =>
//       this.prisma.otpPolicy.update({
//         where: { userId: policy.userId },
//         data: {
//           isBlocked: false,
//           blockUntil: null,
//           otpRequestCount: 0,
//         },
//       }),
//     );
//
//     await Promise.all(updates);
//
//     this.logger.log(`Unblocked ${expiredPolicies.length} expired OTP policies`);
//   }
// }
