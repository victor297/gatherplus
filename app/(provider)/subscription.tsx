import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useStripe } from "@stripe/stripe-react-native";
import {
  useCompleteSubMutation,
  useGetPlansQuery,
  useInitiateSubMutation,
} from "@/redux/api/providersApiSlice";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RefreshControl } from "react-native";

const Subscription = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("plans"); // "plans" or "active"

  const stripe = useStripe();

  // Get plans data
  const {
    data: plansData,
    isLoading: isPlanLoading,
    isFetching,
    refetch,
    error: planError,
  } = useGetPlansQuery({});

  // Initiate and complete subscription mutations
  const [initiateSub] = useInitiateSubMutation();
  const [completeSub] = useCompleteSubMutation();

  // Process plans data to include country-specific pricing
  const [countryPlans, setCountryPlans] = useState([]);
  const { subparam } = useLocalSearchParams();
  const activeSubscriptions = useMemo(() => {
    return subparam ? JSON.parse(subparam as string) : [];
  }, [subparam]);

  useEffect(() => {
    if (plansData?.body) {
      // For this example, we'll use Nigeria (NG) as the default country
      const processedPlans = plansData.body.map((plan) => {
        const countryPlan =
          plan.countryPlans.find((cp) => cp.countryCode === "NG") || {};
        return {
          ...plan,
          displayPrice: countryPlan.price
            ? `₦${parseInt(countryPlan.price).toLocaleString()}`
            : `$${plan.price}`,
          currency: countryPlan.currency || "USD",
          countryPrice: countryPlan.price || plan.price,
        };
      });
      setCountryPlans(processedPlans);
    }
  }, [plansData]);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentMethodSelection = (method) => {
    setPaymentMethod(method);
  };

  const initiatePayment = async () => {
    if (!selectedPlan) {
      Alert.alert("Error", "Please select a subscription plan");
      return;
    }

    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        plan_id: selectedPlan.id,
        payment_channel: paymentMethod,
        currency: selectedPlan.currency,
      };

      const response = await initiateSub(payload).unwrap();

      if (response.code === 200) {
        setPaymentData(response.body);

        // Handle PayStack payment
        if (paymentMethod === "PayStack" && response.body.authorization_url) {
          setShowWebView(true);
        }
        // Handle Stripe payment
        else if (paymentMethod === "Stripe" && response.body.client_secret) {
          await initializeStripePaymentSheet(response.body.client_secret);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
      console.error("Payment initiation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initializeStripePaymentSheet = async (clientSecret) => {
    setStripeLoading(true);
    try {
      // Initialize the payment sheet
      const { error } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Your Company Name",
        allowsDelayedPaymentMethods: true,
        returnURL: "yourapp://stripe-redirect", // Configure this in your app.json
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      // Present the payment sheet
      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        Alert.alert("Error", presentError.message);
      } else {
        // Payment was successful
        await completeSubscription(paymentData.reference);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process payment. Please try again.");
      console.error("Stripe payment error:", error);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleWebViewNavigation = (navState) => {
    const { url } = navState;

    // Check if the URL contains success parameters
    if (url.includes("success") || url.includes("reference=")) {
      setShowWebView(false);

      // Extract reference from URL if available
      let reference = paymentData.reference;
      const referenceMatch = url.match(/reference=([^&]*)/);
      if (referenceMatch && referenceMatch[1]) {
        reference = referenceMatch[1];
      }

      completeSubscription(reference);
    }

    // Check if the URL indicates cancellation
    if (url.includes("close") || url.includes("cancel")) {
      setShowWebView(false);
      Alert.alert("Info", "Payment was cancelled");
    }
  };

  const completeSubscription = async (reference) => {
    try {
      const completePayload = {
        plan_id: selectedPlan.id,
        payment_channel: paymentMethod,
        txn_ref: reference,
      };

      const response = await completeSub(completePayload).unwrap();

      if (response.code === 200) {
        Alert.alert(
          "Success",
          "Your subscription has been activated successfully!"
        );
        // Reset selections
        setSelectedPlan(null);
        setPaymentMethod(null);
        setPaymentData(null);
        // Switch to active subscriptions tab
        setActiveTab("active");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to complete payment. Please contact support."
      );
      console.error("Payment completion error:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPlanName = (planId) => {
    const plan = countryPlans.find((p) => p.id === planId);
    return plan ? plan.name : `Plan ${planId}`;
  };

  if (planError) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-red-500 text-lg mb-4">
          Failed to load subscription plans
        </Text>
        <TouchableOpacity className="bg-primary px-6 py-3 rounded-lg">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Subscription</Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-4 mb-4">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-l-lg ${
            activeTab === "plans" ? "bg-primary" : "bg-gray-700"
          }`}
          onPress={() => setActiveTab("plans")}
        >
          <Text className="text-white text-center font-medium">Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-lg ${
            activeTab === "active" ? "bg-primary" : "bg-gray-700"
          }`}
          onPress={() => setActiveTab("active")}
        >
          <Text className="text-white text-center font-medium">
            Active ({activeSubscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isPlanLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9EDD45" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
            />
          }
        >
          {activeTab === "active" ? (
            // Active Subscriptions View
            <View className="mb-6">
              <Text className="text-white text-xl font-bold mb-4">
                Your Active Subscriptions
              </Text>

              {activeSubscriptions.length === 0 ? (
                <View className="bg-card p-6 rounded-lg items-center">
                  <Feather name="package" size={48} color="#9EDD45" />
                  <Text className="text-white text-lg mt-4 text-center">
                    You don't have any active subscriptions yet
                  </Text>
                  <Text className="text-gray-400 text-center mt-2">
                    Choose a plan to get started
                  </Text>
                  <TouchableOpacity
                    className="bg-primary px-6 py-3 rounded-lg mt-4"
                    onPress={() => setActiveTab("plans")}
                  >
                    <Text className="text-white font-bold">View Plans</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-4">
                  {activeSubscriptions.map((subscription) => (
                    <View
                      key={subscription.id}
                      className="bg-card p-4 rounded-lg border-l-4 border-primary"
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-white text-lg font-bold">
                          {getPlanName(subscription.plan_id)}
                        </Text>
                        <View className="bg-green-800 px-2 py-1 rounded-full">
                          <Text className="text-green-400 text-xs font-medium">
                            {subscription.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between mt-3">
                        <View>
                          <Text className="text-gray-400 text-sm">
                            Start Date
                          </Text>
                          <Text className="text-white">
                            {formatDate(subscription.start_date)}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-gray-400 text-sm">
                            End Date
                          </Text>
                          <Text className="text-white">
                            {formatDate(subscription.end_date)}
                          </Text>
                        </View>
                      </View>

                      <View className="mt-3">
                        <Text className="text-gray-400 text-sm">
                          Subscription ID
                        </Text>
                        <Text className="text-white text-xs">
                          #{subscription.id}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            // Plans View
            <>
              <Text className="text-white text-2xl font-bold mb-6 text-center">
                Choose a Subscription Plan
              </Text>

              <View className="space-y-4 mb-6">
                {countryPlans.map((plan) => {
                  const isActive = activeSubscriptions.some(
                    (sub) => sub.plan_id === plan.id
                  );

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => !isActive && handlePlanSelection(plan)}
                      className={`p-4 rounded-lg border-2 ${
                        selectedPlan?.id === plan.id
                          ? "border-primary bg-primary/10"
                          : isActive
                          ? "border-green-500 bg-green-500/10"
                          : "border-gray-600 bg-card"
                      }`}
                      disabled={isActive}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Text
                            className={`text-lg font-bold ${
                              selectedPlan?.id === plan.id
                                ? "text-primary"
                                : isActive
                                ? "text-green-500"
                                : "text-white"
                            }`}
                          >
                            {plan.name}
                          </Text>
                          {isActive && (
                            <View className="ml-2 bg-green-500 px-2 py-1 rounded-full">
                              <Text className="text-white text-xs">Active</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          className={`text-lg ${
                            selectedPlan?.id === plan.id
                              ? "text-primary"
                              : isActive
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        >
                          {plan.displayPrice}/{plan.frequency.toLowerCase()}
                        </Text>
                      </View>

                      <Text
                        className={`mt-2 ${
                          selectedPlan?.id === plan.id
                            ? "text-primary"
                            : isActive
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {plan.description}
                      </Text>

                      {selectedPlan?.id === plan.id && (
                        <View className="mt-2 flex-row items-center">
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#9EDD45"
                          />
                          <Text className="text-primary ml-2">Selected</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedPlan && (
                <View className="bg-card p-4 rounded-lg mb-6">
                  <Text className="text-white text-lg font-bold mb-4">
                    Select Payment Method
                  </Text>

                  <View className="space-y-3">
                    <TouchableOpacity
                      className={`flex-row justify-between items-center p-4 rounded-lg border-2 ${
                        paymentMethod === "PayStack"
                          ? "border-primary bg-primary/10"
                          : "border-gray-600 bg-background"
                      }`}
                      onPress={() => handlePaymentMethodSelection("PayStack")}
                    >
                      <Text className="text-white">PayStack</Text>
                      {paymentMethod === "PayStack" && (
                        <Feather name="check" size={20} color="#9EDD45" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row justify-between items-center p-4 rounded-lg border-2 ${
                        paymentMethod === "Stripe"
                          ? "border-primary bg-primary/10"
                          : "border-gray-600 bg-background"
                      }`}
                      onPress={() => handlePaymentMethodSelection("Stripe")}
                    >
                      <Text className="text-white">Stripe</Text>
                      {paymentMethod === "Stripe" && (
                        <Feather name="check" size={20} color="#9EDD45" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    className={`mt-4 bg-primary p-4 rounded-lg items-center ${
                      (!paymentMethod || isProcessing || stripeLoading) &&
                      "opacity-50"
                    }`}
                    onPress={initiatePayment}
                    disabled={!paymentMethod || isProcessing || stripeLoading}
                  >
                    {isProcessing || stripeLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold">
                        Subscribe with {paymentMethod || "Selected Method"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <Text className="text-gray-400 text-sm text-center mb-6">
                Your subscription will automatically renew each month. You can
                cancel anytime.
              </Text>
            </>
          )}
        </ScrollView>
      )}

      {/* Paystack WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <View className="flex-1 bg-background pt-12">
          <TouchableOpacity
            onPress={() => setShowWebView(false)}
            className="absolute top-4 left-4 z-10 bg-gray-200 p-2 rounded-full"
          >
            <Feather name="x" size={24} color="black" />
          </TouchableOpacity>

          {paymentData?.authorization_url ? (
            <WebView
              source={{ uri: paymentData.authorization_url }}
              onNavigationStateChange={handleWebViewNavigation}
              startInLoadingState={true}
              renderLoading={() => (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#9EDD45" />
                  <Text className="text-white mt-4">
                    Loading payment gateway...
                  </Text>
                </View>
              )}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#9EDD45" />
              <Text className="text-white mt-4">Preparing payment...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default Subscription;
