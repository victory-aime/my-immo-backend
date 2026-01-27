import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../config/services';
import { UsersService } from '../users/users.service';
import { JwtTokenService } from '../jwt/jwt.service';
import * as bcrypt from 'bcrypt';
import { AppUnauthorizedExceptionService } from '../../config/services';
import { TOKEN_EXCEPTION } from '../../config/enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Validates user credentials.
   * user for login credentials.
   * @throws UnauthorizedException if the email or password is invalid.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUser({ email });

    if (!user) {
      throw new UnauthorizedException(
        'Identifiants invalides (utilisateur introuvable)',
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Refreshes JWT tokens from a valid refresh token.
   * @throws UnauthorizedException if the refresh token is missing or invalid.
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload =
        await this.jwtTokenService.verifyRefreshToken(refreshToken);
      const user = await this.usersService.findUser({ id: payload.sub });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('No refresh token found');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Refresh Token invalid');
      }

      const [newAccessToken, newRefreshToken] = await Promise.all([
        this.jwtTokenService.generateAccessToken({
          id: user.id,
          role: user.role,
        }),
        this.jwtTokenService.generateRefreshToken(user.id),
      ]);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, 12) },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new AppUnauthorizedExceptionService('Sorry try later', {
        code: TOKEN_EXCEPTION.TOKEN_EXPIRED || TOKEN_EXCEPTION.TOKEN_INVALID,
      });
    }
  }

  /**
   * Generate JWT tokens ( access and refresh ) for user authentication.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async login(credentials: { email: string; password: string }): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const user = await this.validateUser(
        credentials.email,
        credentials.password,
      );

      const access_token = this.jwtTokenService.generateAccessToken({
        id: user.id,
        role: user.role,
      });

      const refresh_token = this.jwtTokenService.generateRefreshToken(user.id);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(refresh_token, 12) },
      });

      return {
        message: 'Successfully login',
        access_token,
        refresh_token,
      };
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException(
        'Une erreur est survenue, veuillez réessayer plus tard.',
      );
    }
  }

  /**
   * Logout the user and remove token in DB.
   */
  async logout(userId: string): Promise<{ message: string }> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      return {
        message: 'Successfully logout',
      };
    } catch {
      throw new UnauthorizedException('Sorry try later');
    }
  }

  async loginWithGoogle(googleUser: {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  }): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
  }> {
    // 1. Vérifier si une identité Google existe déjà
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: googleUser.sub,
        },
      },
      include: { user: true },
    });

    let user = identity?.user;

    // 2. Si pas d’identité → créer user + identité
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email ?? null,
          name: googleUser.name!,
          picture: googleUser.picture,
          emailVerified: googleUser.email_verified ?? false,
          role: 'USER',
          status: 'ACTIVE',
        },
      });

      await this.prisma.authIdentity.create({
        data: {
          provider: 'google',
          providerUserId: googleUser.sub,
          userId: user.id,
          email: user.email,
        },
      });
    }

    // 3. Générer TES tokens
    const access_token = this.jwtTokenService.generateAccessToken({
      id: user.id,
      role: user.role,
    });

    const refresh_token = this.jwtTokenService.generateRefreshToken(user.id);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refresh_token, 12) },
    });

    return {
      message: 'Successfully login with Google',
      access_token,
      refresh_token,
    };
  }

  async resetPassword(
    data: { id: string; email: string },
    newPassword: string,
  ) {
    try {
      await this.usersService.resetPassword(data, newPassword);
      return {
        message: '✅ Votre mot de passe a été mis à jour avec succès.',
      };
    } catch (error) {
      throw new BadRequestException(
        'Une erreur est survenue lors de la mise à jour du mot de passe. Veuillez réessayer plus tard.',
      );
    }
  }
}
