import React from "react";
import { Text, View } from "react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useGetTransferRecipientQuery, useGetTransferRequestsQuery } from "@/redux/api/paymentApiSlice";
import { useGetUserWalletQuery } from "@/redux/api/usersApiSlice";

const money = (value: unknown) => Number(value || 0).toLocaleString();

export default function RevenueFoundationScreen() {
  const { data: walletData, isLoading: walletLoading } = useGetUserWalletQuery({});
  const { data: recipientData, isLoading: recipientLoading } =
    useGetTransferRecipientQuery();
  const { data: requestsData, isLoading: requestsLoading } = useGetTransferRequestsQuery();
  const wallet = walletData?.body;
  const rawRequests: any = requestsData?.body;
  const requests = Array.isArray(rawRequests)
    ? rawRequests
    : rawRequests?.result || rawRequests?.body || [];

  return (
    <ProfileFoundationScreen
      isLoading={walletLoading || recipientLoading || requestsLoading}
      title="Revenue"
      subtitle="Payout workspace"
      stats={[
        { label: "Available", value: money(wallet?.available_balance) },
        { label: "Pending", value: money(wallet?.pending_balance) },
        { label: "Requests", value: Array.isArray(requests) ? requests.length : 0 },
      ]}
    >
      <View className="bg-[#1A2432] rounded-lg p-4">
        <Text className="text-white text-lg font-semibold">
          Payout account
        </Text>
        <Text className="text-gray-400 mt-2">
          {recipientData?.body
            ? "Recipient endpoint is connected."
            : "No payout recipient loaded yet."}
        </Text>
      </View>
    </ProfileFoundationScreen>
  );
}
