// src/guard/naboo.guard.ts
// Vérifie la signature HMAC-SHA256 des webhooks NabooPay.
// Utilise le raw body capturé dans main.ts — pas JSON.stringify(req.body)
// qui peut différer du payload signé (ordre des clés, espaces).

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class NabooSignatureGuard implements CanActivate {
  private readonly logger = new Logger(NabooSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const receivedSignature = req.headers['x-signature'] as string | undefined;

    // ── Logs de diagnostic ────────────────────────────────────────────────
    this.logger.debug(`[Webhook] X-Signature reçue : ${receivedSignature ?? 'ABSENTE'}`);

    // 1. Signature présente ?
    if (!receivedSignature) {
      this.logger.warn('[Webhook] Rejeté — en-tête X-Signature manquant');
      throw new UnauthorizedException('Signature manquante');
    }

    // 2. Raw body capturé dans main.ts via express.raw()
    //    Si absent → la config main.ts est incorrecte (bodyParser non désactivé)
    const rawBodyBuffer: Buffer | undefined = (req as any).rawBody;

    let bodyToSign: string;
    if (rawBodyBuffer && Buffer.isBuffer(rawBodyBuffer)) {
      bodyToSign = rawBodyBuffer.toString('utf8');
      this.logger.debug(`[Webhook] Raw body (${rawBodyBuffer.length} bytes) : ${bodyToSign}`);
    } else {
      // Fallback moins fiable — à corriger dans main.ts si ce warning apparaît
      bodyToSign = JSON.stringify(req.body);
      this.logger.warn('[Webhook] rawBody absent — fallback JSON.stringify. Vérifiez main.ts !');
    }

    // 3. Recalcul HMAC-SHA256
    const secret = this.config.get<string>('NABOOPAY_WEBHOOK_SECRET')!;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(bodyToSign, 'utf8')
      .digest('hex');

    this.logger.debug(`[Webhook] Signature attendue : ${expectedSig}`);
    this.logger.debug(`[Webhook] Signature reçue    : ${receivedSignature}`);

    // 4. Comparaison en temps constant (anti timing-attack)
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'utf8'),
        Buffer.from(expectedSig, 'utf8'),
      );
    } catch {
      isValid = false; // longueurs différentes → forcément invalide
    }

    if (!isValid) {
      this.logger.warn('[Webhook] ❌ Signature invalide — requête rejetée');
      throw new UnauthorizedException('Signature invalide');
    }

    this.logger.log('[Webhook] ✅ Signature vérifiée avec succès');
    return true;
  }
}
