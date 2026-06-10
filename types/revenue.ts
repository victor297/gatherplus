export interface Bank {
  code: string;
  id?: string | number;
  name: string;
}

export interface VerifyBankAccountPayload {
  account_number: string;
  bank_code: string;
}

export interface CreateTransferRecipientPayload {
  account_number: string;
  bank_code: string;
  currency: string;
  name: string;
}

export interface TransferRecipient {
  account_name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  id: number;
  recipient_code: string;
  type?: string;
  userId?: number;
}

export interface PaymentRequestPayload {
  amount: number;
  recipient_code: string;
}

export interface RevenueHistoryItem {
  amount: number | string;
  createdAt?: string;
  created_at?: string;
  gross_amount?: number | string;
  id: number;
  net_amount?: number | string;
  recipient?: TransferRecipient;
  recipient_code?: string;
  rejection_reason?: string;
  status: string;
  transfer_fee_amount?: number | string;
  updatedAt?: string;
}

export interface UserWallet {
  available_balance: number | string;
  pending_balance: number | string;
  user_id?: number;
}

export interface WalletCreditItem {
  amount?: number | string;
  booking?: Array<{
    code?: string;
    created_at?: string;
    email?: string;
    final_amount?: number | string;
    fullname?: string;
    id?: number;
  }>;
  created_at?: string;
  event?: {
    currency?: string;
    id?: number;
    start_date?: string;
    title?: string;
  };
  final_amount?: number | string;
  id: number;
  status?: string;
  txn_ref?: string;
}

export interface UserWalletLedger {
  availableCredits: WalletCreditItem[];
  pendingCredits: WalletCreditItem[];
  payoutRequests: RevenueHistoryItem[];
  totals?: {
    availableBalance?: number | string;
    pendingBalance?: number | string;
    totalRequested?: number | string;
  };
  wallet?: UserWallet;
}
