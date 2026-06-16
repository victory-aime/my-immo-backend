// src/push-subscription/dto/register-subscription.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { PushPlatform } from '../../../prisma/generated/enums';

export class RegisterSubscriptionDto {
  @IsEnum(PushPlatform)
  platform: PushPlatform;

  @IsString()
  deviceId: string; // fingerprint unique de l'appareil

  // ── Mobile
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.platform === PushPlatform.MOBILE_EXPO)
  expoToken?: string;

  // ── Web VAPID
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.platform === PushPlatform.WEB)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.platform === PushPlatform.WEB)
  p256dh?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.platform === PushPlatform.WEB)
  authKey?: string;
}

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 512) // les tokens FCM font ~150 chars
  token: string;
}
