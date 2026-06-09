const unsupportedStripePayment = async () => ({
  error: {
    code: "WEB_UNSUPPORTED",
    message: "Stripe payments are available in the mobile app.",
  },
});

export function useAppStripe() {
  return {
    initPaymentSheet: unsupportedStripePayment,
    presentPaymentSheet: unsupportedStripePayment,
  };
}
