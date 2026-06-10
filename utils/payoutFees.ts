export type PayoutFeeBreakdown = {
  currency: string;
  feePolicy: string;
  grossAmount: number;
  netAmount: number;
  transferFeeAmount: number;
};

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const expoEnv = process.env as Record<string, string | undefined>;

const normalizeCurrency = (value?: unknown) =>
  String(value || "NGN").split(/[\s-]/)[0].toUpperCase() || "NGN";

const integerAmount = (value?: unknown) =>
  Math.max(0, Math.floor(Number(value || 0)));

export function estimatePaystackTransferFee(amount: number, currency = "NGN") {
  const normalizedCurrency = normalizeCurrency(currency);
  if (normalizedCurrency !== "NGN") {
    return numberFromEnv(
      expoEnv.EXPO_PUBLIC_PAYSTACK_TRANSFER_FEE_DEFAULT,
      0,
    );
  }

  const firstTierLimit = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_TRANSFER_FEE_TIER_ONE_LIMIT,
    5000,
  );
  const secondTierLimit = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_TRANSFER_FEE_TIER_TWO_LIMIT,
    50000,
  );
  const tierOneFee = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_TRANSFER_FEE_TIER_ONE,
    10,
  );
  const tierTwoFee = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_TRANSFER_FEE_TIER_TWO,
    25,
  );
  const tierThreeFee = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_TRANSFER_FEE_TIER_THREE,
    50,
  );
  const stampDutyThreshold = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_STAMP_DUTY_THRESHOLD,
    10000,
  );
  const stampDutyFee = numberFromEnv(
    expoEnv.EXPO_PUBLIC_PAYSTACK_NGN_STAMP_DUTY,
    50,
  );

  const baseFee =
    amount <= firstTierLimit
      ? tierOneFee
      : amount <= secondTierLimit
        ? tierTwoFee
        : tierThreeFee;
  const stampDuty = amount >= stampDutyThreshold ? stampDutyFee : 0;

  return Math.max(0, Math.ceil(baseFee + stampDuty));
}

export function payoutFeeBreakdown(
  grossAmount: number,
  currency = "NGN",
): PayoutFeeBreakdown {
  const normalizedGross = integerAmount(grossAmount);
  const normalizedCurrency = normalizeCurrency(currency);
  const transferFeeAmount = estimatePaystackTransferFee(
    normalizedGross,
    normalizedCurrency,
  );
  const netAmount = Math.max(0, normalizedGross - transferFeeAmount);

  return {
    currency: normalizedCurrency,
    feePolicy:
      normalizedCurrency === "NGN"
        ? "Paystack transfer fee reserve is deducted before payout."
        : "Transfer fee reserve is deducted before payout.",
    grossAmount: normalizedGross,
    netAmount,
    transferFeeAmount,
  };
}
