import { BadRequestException, ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { getAuthInstance } from '_root/lib/auth';
import { HttpError } from '_root/config/http.error';
import { UsersService } from '_root/modules/users/users.service';
import {
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  ResendVerificationDto,
  ResetPasswordDto,
} from '_root/modules/auth/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────
  // CONNEXION — retourne le token JWT
  // ─────────────────────────────────────────

  async loginUser(data: LoginDto) {
    try {
      const auth = getAuthInstance();

      const response = await auth.api.signInEmail({
        body: {
          email: data.email,
          password: data.password,
        },
      });

      if (!response?.token) {
        throw new HttpError(
          'Erreur lors de la connexion.',
          HttpStatus.UNAUTHORIZED,
          'LOGIN_FAILED',
        );
      }

      return {
        message: 'Connexion réussie',
        session: response,
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur loginUser:', error);
      throw new HttpError(
        'Email ou mot de passe incorrect.',
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
      );
    }
  }

  // ─────────────────────────────────────────
  // CRÉATION USER VIA BETTER-AUTH (backend)
  // ─────────────────────────────────────────

  async registerUser(data: CreateUserDto) {
    try {
      // 1. Vérifier si l'email est déjà pris
      const existing = await this.usersService.findUser({ email: data.email });
      if (existing) {
        throw new ConflictException('Un compte avec cet email existe déjà.');
      }

      // 2. Créer le user via l'API interne Better-Auth
      //    → gère le hash du password, la création Account, etc.
      const auth = getAuthInstance();

      const response = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      });

      if (!response?.user) {
        throw new HttpError('Erreur lors de la création du compte.');
      }

      return {
        message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
        email: response.user.email,
        userId: response.user.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof HttpError) {
        throw error;
      }
      console.error('Erreur createUser:', error);
      throw new HttpError('Une erreur interne est survenue. Veuillez réessayer plus tard.');
    }
  }

  // ─────────────────────────────────────────
  // RENVOI EMAIL DE VÉRIFICATION
  // ─────────────────────────────────────────

  async sendVerificationEmail(data: ResendVerificationDto): Promise<{ message: string }> {
    const user = await this.usersService.findUser({ email: data?.email });
    if (!user) return { message: 'Si ce compte existe, un email a été envoyé.' };
    if (user.emailVerified) throw new BadRequestException('Email déjà vérifié.');

    const auth = getAuthInstance();

    await auth.api.sendVerificationEmail({
      body: {
        email: data?.email,
        callbackURL: data?.callbackURL,
      },
    });

    return { message: 'Email de vérification renvoyé.' };
  }

  // ─────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────

  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      const auth = getAuthInstance();

      const user = await this.usersService.findUser({ email: data.email });
      if (!user) {
        return {
          message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.',
        };
      }

      const response = await auth.api.requestPasswordReset({
        body: { email: data.email },
      });

      if (!response?.status) {
        throw new HttpError('Impossible de générer le lien de réinitialisation.');
      }

      return {
        message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.',
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error('Erreur forgotPassword:', error);
      throw new HttpError('Une erreur interne est survenue. Veuillez réessayer plus tard.');
    }
  }

  // ─────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────

  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const auth = getAuthInstance();

      const response = await auth.api.resetPassword({
        body: {
          token: data.token,
          newPassword: data.newPassword,
        },
      });

      if (!response?.status) {
        throw new HttpError(
          'Lien invalide ou expiré.',
          HttpStatus.BAD_REQUEST,
          'INVALID_RESET_TOKEN',
        );
      }

      return { message: 'Mot de passe réinitialisé avec succès.' };
    } catch (error) {
      if (error instanceof HttpError || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erreur resetPassword:', error);
      throw new HttpError('Lien invalide ou expiré.', HttpStatus.BAD_REQUEST, 'INVALID_TOKEN');
    }
  }

  async checkUserEmail(email: string): Promise<boolean> {
    const user = await this.usersService.findUser({ email });
    return !!user;
  }
}
