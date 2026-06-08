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
  amount: number;
  createdAt: string;
  id: number;
  status: string;
}

export interface UserWallet {
  available_balance: number;
  pending_balance: number;
  user_id?: number;
}
