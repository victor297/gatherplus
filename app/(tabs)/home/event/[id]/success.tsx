import SuccessFeedbackView from "@/app/components/SuccessFeedbackView";

export default function CheckoutSuccessScreen() {
  return (
    <SuccessFeedbackView
      title="Booking confirmed"
      subtitle="Your ticket is ready. Check your email for the receipt and event details."
    />
  );
}
