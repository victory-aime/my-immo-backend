import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateUserDto,
  ForgotPasswordDto,
  ResendVerificationDto,
  ResetPasswordDto,
} from './auth.dto';
import { API_URL } from '_root/config/api';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller()
@AllowAnonymous()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(API_URL.AUTH.REGISTER)
  @HttpCode(HttpStatus.OK)
  async registerUser(@Body() body: CreateUserDto) {
    return this.authService.registerUser(body);
  }

  @Post(API_URL.AUTH.FORGOT_PASSWORD)
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    console.log(body);
    return this.authService.forgotPassword(body);
  }

  @Post(API_URL.AUTH.SEND_VERIFICATION)
  @HttpCode(HttpStatus.OK)
  async sendVerificationEmail(@Body() body: ResendVerificationDto) {
    return this.authService.sendVerificationEmail(body);
  }

  @Post(API_URL.AUTH.RESET_PASSWORD)
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post(API_URL.AUTH.CHECK_EMAIL)
  @ApiOperation({ summary: 'Verifier un email' })
  @ApiOkResponse({
    description: 'return un boolean',
  })
  @ApiBadRequestResponse({
    description: 'Une erreur est survenue réessayer plus tard',
  })
  async checkUserEmail(@Body() data: { email: string }) {
    return this.authService.checkUserEmail(data?.email);
  }
}
