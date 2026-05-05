// ── Types de retour NabooPay ──────────────────────────────────────────────────

export interface NabooTransaction {
  paid_at: string;
  order_id: string;
  checkout_url: string;
  amount: number;
  transaction_status: 'pending' | 'paid' | 'paid_and_blocked' | 'refunded' | 'cancelled';
  selected_payment_method?: string;
}

export interface NabooProduct {
  name: string;
  price: number; // XOF
  quantity: number;
  description?: string;
}

export const NABOO_ERRORS: Record<number, string> = {
  401: 'Clé API NabooPay invalide ou expirée',
  403: 'Accès refusé — vérifiez les permissions du compte NabooPay',
  404: 'Transaction introuvable sur NabooPay',
  429: 'Limite de taux NabooPay atteinte (100 req/min) — réessayez dans quelques secondes',
  500: 'Erreur interne NabooPay',
};
