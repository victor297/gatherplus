import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import Svg, { Rect, Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import {
  useCompleteBookingPaymentMutation,
  useCreateBookingMutation,
  useGetMaxFreeTicketQuery,
} from "@/redux/api/eventsApiSlice";
import { useStripe } from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
import { WebView } from "react-native-webview";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  calculateBookingFees,
  currencySymbol,
  getOnlineRevealLabel,
} from "@/utils/eventHelpers";

const extractPaymentReference = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("reference") ||
      parsed.searchParams.get("trxref") ||
      parsed.searchParams.get("transaction_reference") ||
      parsed.searchParams.get("payment_intent") ||
      ""
    );
  } catch {
    const match = url.match(/(?:reference|trxref|payment_intent)=([^&#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
};

const getStripePaymentIntentId = (clientSecret?: string) =>
  clientSecret?.split("_secret")[0] || "";

export default function OrderSummaryScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const bookingData = JSON.parse(data as string);
  const { userInfo } = useSelector((state: any) => state.auth);
  const [createBooking, { isLoading: isBookingLoading }] =
    useCreateBookingMutation();
  const [completeBookingPayment] = useCompleteBookingPaymentMutation();
  const { data: feeSettings } = useGetMaxFreeTicketQuery({});
  const [isProcessing, setIsProcessing] = useState(false);
  // Payment states
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<
    "Stripe" | "PayStack" | null
  >(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showPaystackWebView, setShowPaystackWebView] = useState(false);
  const paymentCallbackUrl = Linking.createURL(
    `payment-callback/event/${bookingData.event_id}`
  );
  const symbol = currencySymbol(bookingData?.currency);

  // Calculate totals
  const ticketGroups = bookingData.bookings.reduce(
    (groups: any, booking: any) => {
      const name = booking.name;
      if (!groups[name]) {
        groups[name] = { count: 0, total: 0 };
      }
      groups[name].count++;
      groups[name].total += booking.price;
      return groups;
    },
    {}
  );

  const subtotal = bookingData.bookings.reduce(
    (sum: any, booking: any) => sum + booking.price,
    0
  );
  const platformFeeRate = Number(
    bookingData?.platformFeeRate ?? feeSettings?.body?.platform_fee ?? 0
  );
  const fixedFeeAmount = Number(
    bookingData?.fixedFeeAmount ?? feeSettings?.body?.fixed_fee ?? 0
  );
  const fees = calculateBookingFees(
    subtotal,
    platformFeeRate,
    fixedFeeAmount,
    Boolean(bookingData?.absorb_fee)
  );
  const total = fees.total;

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await createBooking({
        ...bookingData,
        channel: "Stripe",
        callback_url: paymentCallbackUrl,
        user_id: userInfo?.sub,
      }).unwrap();

      if (response.message === "SUCCESSFUL" && response.body?.client_secret) {
        return {
          paymentIntent: response.body.client_secret,
          ephemeralKey: response.body.ephemeralKey,
          customer: response.body.customer,
        };
      }
      throw new Error("Failed to fetch payment sheet params");
    } catch (error) {
      Alert.alert("Try Again", error?.data?.body || "Failed to set up payment");
      console.log("Error fetching payment sheet params:", error);
      throw error;
    }
  };

  const completePaymentReference = async (reference?: string) => {
    if (reference) {
      try {
        await completeBookingPayment(reference).unwrap();
      } catch (error) {
        console.log("Payment completion check failed:", error);
      }
    }
    router.replace("/profile/bookings");
  };

  const handleBookEvent = async () => {
    // If total is zero, skip payment gateway and directly submit
    if (total === 0) {
      try {
        console.log(bookingData, "booking");
        const response = await createBooking({
          ...bookingData,
          channel: "Free",
          user_id: userInfo?.sub,
          // or whatever you want to call it
        }).unwrap();
        console.log(response, "free");
        if (response.message === "SUCCESSFUL") {
          router.push(`/home/event/${bookingData.event_id}/success`);
        } else {
          throw new Error("Booking failed");
        }
      } catch (err) {
        console.log(err);
        Alert.alert("Try Again", "Failed to create booking");
      }
      return;
    }

    // For non-zero amounts, proceed with payment flow
    if (!selectedChannel) {
      Alert.alert("Try Again", "Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedChannel === "PayStack") {
        const res = await createBooking({
          ...bookingData,
          channel: selectedChannel,
          callback_url: paymentCallbackUrl,
          user_id: userInfo?.sub,
        }).unwrap();

        if (res?.body?.authorization_url) {
          setIsProcessing(false);
          const result = await WebBrowser.openBrowserAsync(res.body.authorization_url);

          if (result.type === "cancel" || result.type === "dismiss") {
            Alert.alert(
              "Payment not confirmed",
              "If payment was completed, your booking will appear after confirmation.",
              [
                { text: "Stay", style: "cancel" },
                {
                  text: "View bookings",
                  onPress: () => router.replace("/profile/bookings"),
                },
              ]
            );
          }
        } else {
          Alert.alert("Error", "Could not get payment link");
          setIsProcessing(false);
        }
      } else if (selectedChannel === "Stripe") {
        setStripeLoading(true);
        await initializePaymentSheet();
      }
    } catch (err) {
      Alert.alert("Try Again", err?.data?.body || "Failed to set up payment");
      console.log(err, "processssssssss");
      setStripeLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } =
        await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "LogaXP",
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        returnURL: Linking.createURL("stripe-redirect"),
        applePay: {
          merchantCountryCode: "US",
        },
      });

      if (!error) {
        const { error } = await presentPaymentSheet();
        if (error) {
          console.log(error);
          Alert.alert(` ${error.code}`, error.message);
        } else {
          await completePaymentReference(getStripePaymentIntentId(paymentIntent));
        }
      } else {
        Alert.alert("Error", "Failed to initialize payment sheet");
        console.log(error);
      }
    } catch (error) {
      // Alert.alert("Error", error?.data?.body|| "Failed to set up payment");
      console.log(error, "2");
    } finally {
      setStripeLoading(false);
    }
  };
useEffect(() => {
  const sub = Linking.addEventListener("url", ({ url }) => {
    console.log("Payment success redirect received", url);
    if (url.includes("payment-callback")||url.includes("adtil.local")) {
      console.log("Payment success redirect received");
      WebBrowser.dismissBrowser();
      completePaymentReference(extractPaymentReference(url));
    }
  });

  return () => sub.remove();
}, []);
  const handlePaystackWebViewNavigation = (navState: any) => {
    const { url } = navState;
    console.log("WebView current URL:", url);

    // Only close if it's a redirect to a success or cancel page, not the Paystack page itself
    // Most Paystack checkout URLs contain 'reference=', so we should be careful.
    // Usually, Paystack redirects to your callback URL which would have these keywords.
    const isSuccess = url.includes("success") || 
                     url.includes("successful") || 
                     url.includes("checkout-done") ||
                     url.includes("callback") && (url.includes("reference=") || url.includes("trxref=")) ||
                     url.includes("payment_received") ||
                     url.includes("status=success") ||
                     url.includes("transaction_complete") ||
                     url.includes("confirmed") ||
                     url.includes("completed");
 
    if (isSuccess) {
      console.log("Success detected at URL:", url);
      setShowPaystackWebView(false);
      setPaymentResponse(null);
      // Use replace instead of push for a cleaner transition
      router.replace("/profile/bookings" as any);
      return;
    }
 
    if (url.includes("close") || url.includes("cancel") || url.includes("checkout-back") || url.includes("abort") || url.includes("error")) {
      console.log("Exit condition detected at URL:", url);
      setShowPaystackWebView(false);
      setPaymentResponse(null);
      if (url.includes("error")) {
         Alert.alert("Error", "Something went wrong with the payment");
      }
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Order Summary</Text>
      </View>

      {/* Order Details */}
      <ScrollView className="flex-1 px-4">
        <Text className="text-white text-xl mb-4">Tickets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bookingData.bookings.map((booking: any, index: any) => (
            <View
              className="relative w-80 m-1"
              key={`${booking.ticket_id}-${index}`}
            >
              <Svg height="100" width="100%" viewBox="0 0 520 160">
                <Rect
                  x="0"
                  y="0"
                  width="520"
                  height="160"
                  rx="10"
                  ry="10"
                  fill="white"
                  stroke="gray"
                  strokeWidth="2"
                />
                <Circle
                  cx="0"
                  cy="80"
                  r="20"
                  fill="#020e1e"
                  stroke="#020e1e"
                  strokeWidth="2"
                />
                <Circle
                  cx="520"
                  cy="80"
                  r="20"
                  fill="#020e1e"
                  stroke="#020e1e"
                  strokeWidth="2"
                />
              </Svg>
              <View className="absolute top-0 left-0 w-full h-full flex justify-center items-center p-4">
                <Text className="text-lg font-bold text-blue-600 text-center">
                  {booking.name}
                </Text>
                <View className="flex-row justify-center gap-2 items-center">
                  <QRCode
                    value={`${booking.session_id}-${booking.ticket_id}-${index}`}
                    size={50}
                  />
                  <View>
                    <Text className="text-base text-gray-700">
                      {booking.fullname}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {booking.email}
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-sm bg-blue-600 p-1 rounded-full">
                    {booking?.price == 0
                      ? "Free"
                      : `${symbol} ${booking?.price?.toLocaleString()}`}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Order Summary */}
        <View className="mt-6">
          <Text className="text-white text-xl mb-4">Order Details</Text>
          <View className="space-y-3">
            {Object.entries(ticketGroups).map(([name, group]: any) => (
              <View className="flex-row justify-between" key={name}>
                <Text className="text-gray-400">{name}</Text>
                <Text className="text-white">
                  {group?.count} x {symbol}
                  {(group?.total / group?.count).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
          <View className="h-[1px] bg-[#1A2432] my-4" />
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Sub-total</Text>
              <Text className="text-white">
                {symbol}
                {subtotal.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Platform fee</Text>
              <Text className="text-white">
                {symbol} {fees.platformFee.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Fixed fee</Text>
              <Text className="text-white">
                {symbol} {fees.fixedFee.toLocaleString()}
              </Text>
            </View>
            {bookingData?.absorb_fee && subtotal > 0 && (
              <Text className="text-gray-500 text-xs">
                The organizer covers buyer fees for this event.
              </Text>
            )}
            {bookingData?.age_restriction > 0 && (
              <Text className="text-gray-400 text-sm">
                Age rule: {bookingData.age_restriction}+ required.
              </Text>
            )}
            {bookingData?.guardian_required && (
              <Text className="text-gray-400 text-sm">
                Guardian confirmation included.
              </Text>
            )}
            <Text className="text-gray-400 text-sm">
              Event updates: {bookingData?.receive_updates ? "On" : "Off"}
            </Text>
            {(bookingData?.attendance_mode === "ONLINE" ||
              bookingData?.attendance_mode === "HYBRID") ? (
              <Text className="text-gray-400 text-sm">
                Online access: {getOnlineRevealLabel(bookingData?.online_url_reveal)}
              </Text>
            ) : null}
          </View>
          <View className="h-[1px] bg-[#1A2432] my-4" />
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary text-xl font-bold">
              {symbol} {total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Only show payment method selection if total is not zero */}
        {total > 0 && (
          <View className="mt-6">
            <Text className="text-white text-xl mb-4">
              Select Payment Method
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`flex-1 mr-2 p-4 rounded-lg ${
                  selectedChannel === "Stripe" ? "bg-primary" : "bg-gray-800"
                }`}
                onPress={() => setSelectedChannel("Stripe")}
              >
                <Text className="text-white text-center font-semibold">
                  Stripe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 ml-2 p-4 rounded-lg ${
                  selectedChannel === "PayStack" ? "bg-primary" : "bg-gray-800"
                }`}
                onPress={() => setSelectedChannel("PayStack")}
              >
                <Text className="text-white text-center font-semibold">
                  Paystack
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleBookEvent}
          disabled={
            isProcessing ||
            isBookingLoading ||
            stripeLoading ||
            (total > 0 && !selectedChannel)
          }
        >
          <Text className="text-background text-center font-semibold">
            {isProcessing || isBookingLoading || stripeLoading
              ? "Processing..."
              : total > 0
              ? "Proceed to Payment"
              : "Confirm Booking"}
          </Text>
        </TouchableOpacity>
      </View>


    </View>
  );
}
