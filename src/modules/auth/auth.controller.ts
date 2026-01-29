import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { API_URL } from '_root/config/api';
import { ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '_root/config/enum';
import { LoginDto, RefreshTokenDto, ResetPasswordDto } from './auth.dto';
import { GoogleAuthGuard } from '_root/guard/google.guard';
import { UsersService } from '_root/modules/users/users.service';

@ApiTags(SWAGGER_TAGS.AUTH_MANAGEMENT)
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post(API_URL.AUTH.LOGIN)
  async login(@Body() user: LoginDto) {
    console.log('login dto', user);
    return this.authService.login(user);
  }

  @Post(API_URL.AUTH.SSO_GOOGLE)
  @UseGuards(GoogleAuthGuard)
  async googleLogin(
    @Req()
    req: {
      user: {
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };
    },
  ) {
    console.log('req backend', req);
    return this.authService.loginWithGoogle(req.user);
  }

  @Post(API_URL.AUTH.REFRESH_TOKEN)
  async register(@Body() data: RefreshTokenDto) {
    return this.authService.refreshTokens(data.refresh_token);
  }

  @Post(API_URL.AUTH.LOGOUT)
  async logout(@Query('id_token') id_token: string) {
    return this.authService.logout(id_token);
  }

  @Post(API_URL.AUTH.RESET_PASSWORD)
  async resetPassword(@Body() user: ResetPasswordDto) {
    return this.authService.resetPassword(user, user?.password);
  }
}
