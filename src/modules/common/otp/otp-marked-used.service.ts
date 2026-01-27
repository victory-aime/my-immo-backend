import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '_root/config/services';

@Injectable()
export class OtpMarkedUsedCronServiceService {
  private readonly logger = new Logger(OtpMarkedUsedCronServiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markExpiredOtpAsUsed() {
    const now = new Date();

    const result = await this.prisma.otpCode.updateMany({
      where: {
        expiresAt: { lt: now },
        used: false,
      },
      data: { used: true },
    });

    if (result.count > 0) {
      this.logger.log(`🕐 ${result.count} OTP expirés marqués comme utilisés`);
    }
  }
}
