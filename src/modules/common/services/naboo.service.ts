// src/payment/naboo.service.ts
// Wrapper NestJS autour de l'API NabooPay.
// Injecté dans PaymentService via le module.

import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios, { AxiosError } from 'axios';
import { NABOO_ERRORS, NabooProduct, NabooTransaction } from '../naboo';

@Injectable()
export class NabooService {
  private readonly logger = new Logger(NabooService.name);
  private readonly baseUrl: string;
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = process.env.NABOOPAY_URL!;
  }

  // ── Headers d'authentification ─────────────────────────────────────────────
  private get authHeaders() {
    return {
      Authorization: `Bearer ${this.config.get<string>('NABOOPAY_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  // ── Gestion centralisée des erreurs Axios/NabooPay ────────────────────────
  private handleError(err: AxiosError, context: string): never {
    this.logger.error(err);
    const status = err.response?.status ?? 503;
    const message = NABOO_ERRORS[status] ?? (err.response?.data as any)?.message ?? err.message;
    this.logger.error(`[${context}] ${status} — ${message}`);
    throw new HttpException(message, status);
  }

  // ── 1. Créer une transaction de collecte ───────────────────────────────────
  /**
   * Initialise une transaction NabooPay pour un abonnement SaaS.
   * fees_customer_side: true → les frais sont ajoutés au total du client.
   */
  async createTransaction(params: {
    products: NabooProduct[];
    successUrl: string;
    errorUrl: string;
  }): Promise<NabooTransaction> {
    try {
      const { data } = await axios.post<NabooTransaction>(
        `${this.baseUrl}/transactions`,
        {
          method_of_payment: ['wave', 'orange_money'],
          products: params.products,
          success_url: params.successUrl,
          error_url: params.errorUrl,
          fees_customer_side: true,
          is_escrow: false,
          is_merchant: false,
        },
        { headers: this.authHeaders },
      );
      this.logger.log(`transaction crée — order_id: ${data}`);
      return data;
    } catch (err) {
      console.log('error', err);
      this.handleError(err as AxiosError, 'createTransaction');
    }
  }

  // ── 2. Vérifier le statut d'une transaction (double-check webhook) ─────────
  async getTransaction(orderId: string): Promise<NabooTransaction> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<NabooTransaction>(`${this.baseUrl}/transactions/${orderId}`, {
          headers: this.authHeaders,
        }),
      );
      this.logger.log(
        `transaction récupérée — order_id: ${data.order_id}, status: ${data.transaction_status}`,
      );
      return data;
    } catch (err) {
      this.handleError(err as AxiosError, 'getTransaction');
    }
  }
}
