import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '_root/config/services';
import { UsersService } from '../../users/users.service';
import { formatRemainingTime } from '../utils/remaining-time';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  private verifyOTP(secret: string, otp: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otp,
      window: 2,
      step: 90,
    });
  }

  private checkBlockPolicy(policy: {
    isBlocked: boolean;
    blockUntil: Date | null;
  }) {
    if (
      policy.isBlocked &&
      policy.blockUntil &&
      new Date() < policy.blockUntil
    ) {
      const retry = formatRemainingTime(policy.blockUntil);
      throw new UnauthorizedException({
        message: retry.message,
        retryAfter: retry.seconds,
      });
    }
  }

  async generateOtp(email: string): Promise<{
    expiresIn: number;
    email: string;
    message: string;
  }> {
    const user = await this.userService.findUser({ email });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const policy = await this.prisma.otpPolicy.findUnique({
      where: { userId: user.id },
    });

    if (policy) this.checkBlockPolicy(policy);

    await this.prisma.otpCode.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        used: true,
        expiresAt: new Date(),
      },
    });

    const otpSecret = speakeasy.generateSecret({ length: 20 });
    const step = 90;
    const window = 2;
    const expiresIn = step * window;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const otp = speakeasy.totp({
      secret: otpSecret.base32,
      encoding: 'base32',
      step,
    });

    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        secret: otpSecret.base32,
        expiresAt,
      },
    });

    const requestCount = (policy?.otpRequestCount ?? 0) + 1;
    const isBlocked = requestCount >= (policy?.limit ?? 3);
    const blockDuration = 5 * 60 * 1000;

    await this.prisma.otpPolicy.upsert({
      where: { userId: user.id },
      update: {
        isBlocked,
        otpRequestCount: requestCount,
        blockUntil: isBlocked ? new Date(Date.now() + blockDuration) : null,
      },
      create: {
        userId: user.id,
      },
    });

    if (isBlocked) {
      const retry = formatRemainingTime(new Date(Date.now() + blockDuration));
      throw new UnauthorizedException({
        message: retry.message,
        retryAfter: retry.seconds,
      });
    }

    const getExpirationMinutes = (expiresAt: Date) =>
      Math.ceil((expiresAt.getTime() - Date.now()) / 60000);

    // await this.sendOTPByEmail(
    //   { name: user?.lastName, email: user?.email },
    //   {
    //     otp,
    //     expireTime: getExpirationMinutes(expiresAt),
    //     username: user?.firstName,
    //   },
    // );
    return { expiresIn, email: user.email!, message: 'Code envoyé' };
  }

  async validateOtp(email: string, otp: string): Promise<{ message: string }> {
    const user = await this.userService.findUser({ email });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const latestOtp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, code: otp },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) throw new UnauthorizedException('OTP invalide');
    if (new Date() > latestOtp.expiresAt || latestOtp.used)
      throw new UnauthorizedException('OTP expiré ou déjà utilisé');

    const isValid = this.verifyOTP(latestOtp.secret, otp);
    if (!isValid) throw new UnauthorizedException('OTP invalide');

    await this.prisma.otpCode.update({
      where: { id: latestOtp.id },
      data: { used: true },
    });

    await this.prisma.otpPolicy.update({
      where: { userId: user.id },
      data: {
        isBlocked: false,
        blockUntil: null,
        otpRequestCount: 0,
      },
    });

    return { message: 'OTP validé avec succès' };
  }

  // private async sendOTPByEmail(
  //   user: { name: string; email: string },
  //   data: {
  //     otp: string;
  //     expireTime: number;
  //     username: any;
  //   },
  // ): Promise<void> {
  //   await this.emailService.sendEmail(
  //     { recipients: { name: user?.name, address: user?.email }, text: 'OTP' },
  //     data,
  //   );
  // }
}
