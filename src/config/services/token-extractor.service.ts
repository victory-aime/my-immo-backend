import { Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { AppUnauthorizedExceptionService } from './AppUnauthorizedException.service';
import { TOKEN_EXCEPTION } from '../enum';

@Injectable()
export class TokenExtractorService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Extrait et décode le token JWT depuis la requête
   */
  async extractUserFromRequest(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppUnauthorizedExceptionService('Token manquant ou invalide', {
        code: TOKEN_EXCEPTION.NO_TOKEN,
      });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET_KEY;

    if (!secret) {
      throw new Error('JWT_SECRET_KEY non défini dans .env');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret });
      (request as any).user = payload; // facultatif : pour chaînage entre guards
      return payload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AppUnauthorizedExceptionService('Token expiré', {
          code: TOKEN_EXCEPTION.TOKEN_EXPIRED,
        });
      }
      throw new AppUnauthorizedExceptionService(
        'Token invalide ou signature incorrecte',
        {
          code: TOKEN_EXCEPTION.TOKEN_INVALID,
        },
      );
    }
  }
}
