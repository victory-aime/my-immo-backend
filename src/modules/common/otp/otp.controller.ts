import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { API_URL } from '_root/config/api';
import { OtpService } from './otp.service';
import { ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '_root/config/enum';
import { GenerateOtpDto, ValidateOtpDto } from './otp.dto';

@ApiTags(SWAGGER_TAGS.OTP_MANAGEMENT)
@Controller(API_URL.COMMON.OTP.GLOBAL_ROUTES)
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post(API_URL.COMMON.OTP.GENERATE)
  @HttpCode(HttpStatus.CREATED)
  async generateOTP(@Body() data: GenerateOtpDto) {
    return await this.otpService.generateOtp(data.email);
  }

  @Post(API_URL.COMMON.OTP.VALIDATE)
  async verifyOTP(@Body() data: ValidateOtpDto) {
    return await this.otpService.validateOtp(data.email, data.otp);
  }
}
