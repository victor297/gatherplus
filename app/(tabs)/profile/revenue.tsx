import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowUpRight,
  Building2,
  CheckCircle,
  CreditCard,
  RefreshCcw,
  Search,
  Send,
  Wallet,
  X,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useCreateTransferRecipientMutation,
  useGetBanksQuery,
  useGetTransferRecipientQuery,
  useGetTransferRequestsQuery,
  useRequestPaymentMutation,
  useVerifyBankAccountMutation,
} from "@/redux/api/paymentApiSlice";
import { useGetUserWalletLedgerQuery, useGetUserWalletQuery } from "@/redux/api/usersApiSlice";
import type { Bank, RevenueHistoryItem, TransferRecipient } from "@/types/revenue";
import { payoutFeeBreakdown } from "@/utils/payoutFees";

type LedgerType = "available" | "pending" | "requested";

const normalizeCurrency = (value?: unknown) =>
  String(value || "NGN").split(/[\s-]/)[0] || "NGN";

const money = (value?: unknown, currency?: unknown) => {
  const amount = Number(value || 0);
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
};

const payoutGross = (request: RevenueHistoryItem) =>
  Number(
    request.gross_amount ||
      Number(request.amount || 0) + Number(request.transfer_fee_amount || 0)
  );

const payoutNet = (request: RevenueHistoryItem) =>
  Number(request.net_amount || request.amount || 0);

const payoutFee = (request: RevenueHistoryItem) =>
  Number(request.transfer_fee_amount || Math.max(0, payoutGross(request) - payoutNet(request)));

const statusStyle = (status?: string) => {
  const normalized = String(status || "").toUpperCase();
  if (["COMPLETED", "SUCCESS", "REMITTED"].includes(normalized)) {
    return "bg-[#9EDD45]/15 text-[#9EDD45]";
  }
  if (["PENDING", "INITIATED"].includes(normalized)) {
    return "bg-[#5B4DFF]/15 text-[#B9B3FF]";
  }
  return "bg-red-500/15 text-red-300";
};

const unwrapRecipient = (payload: any): TransferRecipient | null => {
  const body = payload?.body?.body || payload?.body || payload;
  if (Array.isArray(body)) return body[0] || null;
  if (Array.isArray(body?.result)) return body.result[0] || null;
  return body && typeof body === "object" ? body : null;
};

const unwrapRequests = (payload: any): RevenueHistoryItem[] => {
  const body = payload?.body?.body || payload?.body || payload;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.result)) return body.result;
  if (Array.isArray(body?.body)) return body.body;
  return [];
};

const unwrapBanks = (payload: any): Bank[] => {
  const body = payload?.body?.body || payload?.body || payload;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.body)) return body.body;
  return [];
};

export default function RevenueScreen() {
  const router = useRouter();
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useGetUserWalletQuery({});
  const { data: ledgerData, isLoading: ledgerLoading, refetch: refetchLedger } = useGetUserWalletLedgerQuery({});
  const { data: recipientData, isLoading: recipientLoading, refetch: refetchRecipient } =
    useGetTransferRecipientQuery();
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } =
    useGetTransferRequestsQuery();
  const { data: banksData } = useGetBanksQuery();
  const [verifyBankAccount, { isLoading: isVerifying }] = useVerifyBankAccountMutation();
  const [createRecipient, { isLoading: isCreatingRecipient }] = useCreateTransferRecipientMutation();
  const [requestPayment, { isLoading: isRequesting }] = useRequestPaymentMutation();

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [requestAmount, setRequestAmount] = useState("");

  const wallet = walletData?.body || ledgerData?.body?.wallet || {};
  const ledger = ledgerData?.body || {};
  const recipient = unwrapRecipient(recipientData);
  const requests = unwrapRequests(requestsData);
  const banks = unwrapBanks(banksData);
  const filteredBanks = banks.filter((bank) =>
    String(bank.name || "").toLowerCase().includes(bankSearch.toLowerCase())
  );

  const available = Number(ledger?.totals?.availableBalance ?? wallet?.available_balance ?? 0);
  const pending = Number(ledger?.totals?.pendingBalance ?? wallet?.pending_balance ?? 0);
  const requested = Number(
    ledger?.totals?.totalRequested ??
      requests.reduce((sum, request) => sum + payoutGross(request), 0)
  );
  const requestGrossAmount = Number(requestAmount || 0);
  const requestPayoutPreview = payoutFeeBreakdown(requestGrossAmount, currency);
  const requestNetAmount = requestPayoutPreview.netAmount;
  const canSubmitPayout =
    !isRequesting &&
    requestGrossAmount > 0 &&
    requestGrossAmount <= available &&
    requestNetAmount > 0;

  const latestRequests = useMemo(() => requests.slice(0, 5), [requests]);
  const loading = walletLoading || ledgerLoading || recipientLoading || requestsLoading;

  const refreshAll = () => {
    refetchWallet();
    refetchLedger();
    refetchRecipient();
    refetchRequests();
  };

  const openLedger = (type: LedgerType) => {
    router.push({ pathname: "/profile/revenue/ledger" as any, params: { type } });
  };

  const handleVerify = async () => {
    if (!selectedBank?.code || accountNumber.length < 8) {
      Alert.alert("Account required", "Choose a bank and enter a valid account number.");
      return;
    }

    try {
      const response = await verifyBankAccount({
        account_number: accountNumber,
        bank_code: selectedBank.code,
      }).unwrap();
      const body: any = response?.body || response;
      const resolvedName = body?.account_name || body?.data?.account_name || body?.body?.account_name;
      setAccountName(resolvedName || accountName);
      Alert.alert("Account verified", resolvedName || "Bank account verified.");
    } catch {
      Alert.alert("Verification failed", "Please confirm the bank and account number.");
    }
  };

  const handleSaveRecipient = async () => {
    if (!selectedBank?.code || !accountNumber || !accountName) {
      Alert.alert("Complete account", "Verify the account before saving your payout recipient.");
      return;
    }

    try {
      await createRecipient({
        account_number: accountNumber,
        bank_code: selectedBank.code,
        currency,
        name: accountName,
      }).unwrap();
      setAccountModalOpen(false);
      setAccountNumber("");
      setAccountName("");
      setSelectedBank(null);
      refetchRecipient();
      Alert.alert("Payout account saved", "Your payout recipient is ready.");
    } catch {
      Alert.alert("Save failed", "We could not save this payout account yet.");
    }
  };

  const handleRequestPayout = async () => {
    const amount = Number(requestAmount);
    if (!recipient?.recipient_code) {
      Alert.alert("Payout account needed", "Add a payout account before requesting funds.");
      return;
    }
    if (!amount || amount <= 0 || amount > available) {
      Alert.alert("Invalid amount", "Enter an amount within your available balance.");
      return;
    }
    if (requestNetAmount <= 0) {
      Alert.alert(
        "Amount too low",
        "The requested amount must be greater than the Paystack payout fee reserve."
      );
      return;
    }

    try {
      await requestPayment({
        amount,
        recipient_code: recipient.recipient_code,
      }).unwrap();
      setRequestModalOpen(false);
      setRequestAmount("");
      refreshAll();
      Alert.alert(
        "Payout requested",
        `Gross request: ${money(requestPayoutPreview.grossAmount, currency)}\nPaystack fee reserve: ${money(
          requestPayoutPreview.transferFeeAmount,
          currency
        )}\nNet payout: ${money(requestPayoutPreview.netAmount, currency)}`
      );
    } catch {
      Alert.alert("Request failed", "We could not submit this payout request yet.");
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={loading}
      title="Revenue"
      subtitle="Wallet integrity, payout account, withdrawal requests, and transaction history."
      stats={[]}
    >
      <View className="flex-row justify-end mb-4">
        <TouchableOpacity
          className="bg-[#111823] border border-[#243044] rounded-xl px-4 py-3 flex-row items-center"
          onPress={refreshAll}
        >
          <RefreshCcw color="#E5E7EB" size={16} />
          <Text className="text-white font-semibold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-3 mb-5">
        <BalanceCard
          accent="#5B4DFF"
          icon={<Wallet color="white" size={21} />}
          label="Available balance"
          value={money(available, currency)}
          onPress={() => openLedger("available")}
        />
        <BalanceCard
          accent="#9EDD45"
          icon={<CreditCard color="#020817" size={21} />}
          label="Pending balance"
          value={money(pending, currency)}
          onPress={() => openLedger("pending")}
        />
        <BalanceCard
          accent="#5B4DFF"
          icon={<Send color="white" size={21} />}
          label="Total requested"
          value={money(requested, currency)}
          onPress={() => openLedger("requested")}
        />
      </View>

      <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mb-5">
        <View className="flex-row items-start">
          <View className="w-12 h-12 rounded-full bg-[#9EDD45] items-center justify-center">
            <CheckCircle color="#020817" size={22} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-semibold">Payout safeguards</Text>
            <Text className="text-gray-400 mt-1">
              Funds become withdrawable only after eligible sales clear internal checks.
            </Text>
          </View>
        </View>
        <View className="mt-4 gap-3">
          <SafetyRow text="Pending event revenue is held until it is eligible for remittance." />
          <SafetyRow text="Withdrawal requests reserve funds immediately, so the same balance cannot be requested twice." />
          <SafetyRow text="Payout accounts must be verified before funds can be requested." />
          <SafetyRow text="Paystack transfer fees are deducted from the requested funds before payout." />
        </View>
      </View>

      <View className="gap-4">
        <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
          <View className="p-5 border-b border-[#243044] flex-row items-start justify-between">
            <View className="flex-row flex-1 pr-3">
              <View className="w-12 h-12 rounded-full bg-[#5B4DFF] items-center justify-center">
                <Building2 color="white" size={22} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-xl font-semibold">Payout account</Text>
                <Text className="text-gray-400 mt-1">
                  Save the bank account where approved payouts should be sent.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="border border-[#2E3A4D] rounded-xl px-4 py-3"
              onPress={() => setAccountModalOpen(true)}
            >
              <Text className="text-white font-semibold">{recipient ? "Update" : "Add"}</Text>
            </TouchableOpacity>
          </View>
          <View className="p-5">
            {recipient ? (
              <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4">
                <Text className="text-gray-400 text-xs uppercase tracking-[2px]">Active recipient</Text>
                <Text className="text-white text-lg font-semibold mt-2">{recipient.account_name}</Text>
                <Text className="text-gray-400 mt-1">
                  {recipient.account_number} · {recipient.bank_code} · {recipient.currency || currency}
                </Text>
                <Text className="text-gray-500 mt-2">Recipient code: {recipient.recipient_code}</Text>
              </View>
            ) : (
              <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4">
                <Text className="text-white font-semibold">No payout account saved yet.</Text>
                <TouchableOpacity
                  className="bg-primary rounded-xl px-5 py-3 mt-4 self-start"
                  onPress={() => setAccountModalOpen(true)}
                >
                  <Text className="text-background font-bold">Add payout account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
          <View className="p-5 border-b border-[#243044] flex-row items-start justify-between">
            <View className="flex-row flex-1 pr-3">
              <View className="w-12 h-12 rounded-full bg-[#5B4DFF] items-center justify-center">
                <ArrowUpRight color="white" size={22} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-xl font-semibold">Request payout</Text>
                <Text className="text-gray-400 mt-1">Withdraw available funds after payout fees are reserved.</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-primary rounded-xl px-4 py-3 disabled:opacity-40"
              disabled={!recipient || available <= 0}
              onPress={() => setRequestModalOpen(true)}
            >
              <Text className="text-background font-bold">New request</Text>
            </TouchableOpacity>
          </View>
          <View className="p-5">
            <Text className="text-gray-400">
              {recipient
                ? `Ready to request up to ${money(available, currency)} gross. Paystack fee reserve is deducted from the request before payout.`
                : "Add a payout account to enable withdrawal requests."}
            </Text>
          </View>
        </View>

        <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
          <View className="p-5 border-b border-[#243044]">
            <Text className="text-white text-xl font-semibold">Payout history</Text>
            <Text className="text-gray-400 mt-1">Recent withdrawal requests and payout status.</Text>
          </View>
          {latestRequests.length ? (
            latestRequests.map((request) => {
              const historyCurrency = request.recipient?.currency || currency;
              return (
              <View key={request.id} className="p-4 border-b border-[#243044]">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-semibold">
                      {money(payoutNet(request), historyCurrency)} net payout
                    </Text>
                    <Text className="text-gray-400 mt-1">
                      {request.createdAt || request.created_at || "Date not available"}
                    </Text>
                    <Text className="text-gray-500 mt-1 text-xs">
                      Gross {money(payoutGross(request), historyCurrency)} · Fee {money(
                        payoutFee(request),
                        historyCurrency
                      )}
                    </Text>
                  </View>
                  <Text className={`${statusStyle(request.status)} rounded-full px-3 py-1 text-xs font-semibold`}>
                    {request.status}
                  </Text>
                </View>
              </View>
            );
            })
          ) : (
            <Text className="text-gray-400 p-5">No payout history found.</Text>
          )}
        </View>
      </View>

      <Modal visible={accountModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/70 px-5 justify-center">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl max-h-[88%] overflow-hidden">
            <View className="p-5 border-b border-[#243044] flex-row justify-between items-center">
              <Text className="text-white text-xl font-semibold">Payout account</Text>
              <TouchableOpacity onPress={() => setAccountModalOpen(false)}>
                <X color="#E5E7EB" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-gray-300 font-semibold mb-2">Currency</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                value={currency}
                onChangeText={(value) => setCurrency(value.toUpperCase())}
                placeholder="NGN"
                placeholderTextColor="#728097"
              />

              <Text className="text-gray-300 font-semibold mb-2">Bank</Text>
              <View className="flex-row items-center bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 mb-3">
                <Search color="#8B6BFF" size={17} />
                <TextInput
                  className="flex-1 text-white py-3 ml-2"
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  placeholder="Search bank"
                  placeholderTextColor="#728097"
                />
              </View>
              <View className="max-h-48 mb-4">
                <ScrollView nestedScrollEnabled>
                  {filteredBanks.slice(0, 30).map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      className={`border rounded-xl p-3 mb-2 ${
                        selectedBank?.code === bank.code
                          ? "border-primary bg-primary/10"
                          : "border-[#2E3A4D] bg-[#1A2432]"
                      }`}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <Text className="text-white font-semibold">{bank.name}</Text>
                      <Text className="text-gray-500 text-xs mt-1">{bank.code}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text className="text-gray-300 font-semibold mb-2">Account number</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-4"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter account number"
                placeholderTextColor="#728097"
              />

              <TouchableOpacity
                className="border border-[#2E3A4D] rounded-xl py-3 mb-4 flex-row justify-center items-center disabled:opacity-50"
                disabled={isVerifying}
                onPress={handleVerify}
              >
                {isVerifying ? <ActivityIndicator color="#9EDD45" /> : <CheckCircle color="#9EDD45" size={18} />}
                <Text className="text-white font-semibold ml-2">Verify account</Text>
              </TouchableOpacity>

              <Text className="text-gray-300 font-semibold mb-2">Account name</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-5"
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Verified account name"
                placeholderTextColor="#728097"
              />

              <TouchableOpacity
                className="bg-primary rounded-xl py-4 disabled:opacity-50"
                disabled={isCreatingRecipient}
                onPress={handleSaveRecipient}
              >
                <Text className="text-background text-center font-bold">
                  {isCreatingRecipient ? "Saving..." : "Save payout account"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={requestModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/70 px-5 justify-center">
          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
            <View className="p-5 border-b border-[#243044] flex-row justify-between items-center">
              <Text className="text-white text-xl font-semibold">Request payout</Text>
              <TouchableOpacity onPress={() => setRequestModalOpen(false)}>
                <X color="#E5E7EB" size={22} />
              </TouchableOpacity>
            </View>
            <View className="p-5">
              <Text className="text-gray-400 mb-4">
                Available balance: {money(available, currency)}
              </Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-5"
                keyboardType="decimal-pad"
                value={requestAmount}
                onChangeText={setRequestAmount}
                placeholder="Gross amount to request"
                placeholderTextColor="#728097"
              />
              <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-4">
                <Text className="text-gray-400 text-xs uppercase tracking-[2px] mb-3">
                  Payout preview
                </Text>
                <PreviewRow
                  label="Gross request"
                  value={money(requestPayoutPreview.grossAmount, currency)}
                />
                <PreviewRow
                  label="Paystack fee reserve"
                  value={`-${money(requestPayoutPreview.transferFeeAmount, currency)}`}
                />
                <View className="h-px bg-[#2E3A4D] my-3" />
                <PreviewRow
                  label="Net payout"
                  value={money(requestPayoutPreview.netAmount, currency)}
                  strong
                />
                <Text className="text-gray-500 text-xs mt-3 leading-5">
                  {requestPayoutPreview.feePolicy} The backend validates this again before reserving funds.
                </Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 disabled:opacity-50"
                disabled={!canSubmitPayout}
                onPress={handleRequestPayout}
              >
                <Text className="text-background text-center font-bold">
                  {isRequesting ? "Submitting..." : "Submit payout request"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ProfileFoundationScreen>
  );
}

function BalanceCard({
  accent,
  icon,
  label,
  onPress,
  value,
}: {
  accent: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <TouchableOpacity
      className="bg-[#111823] border border-[#243044] rounded-2xl p-4 flex-row items-center"
      onPress={onPress}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: accent }}>
        {icon}
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-gray-400">{label}</Text>
        <Text className="text-white text-2xl font-bold mt-1">{value}</Text>
      </View>
      <ArrowUpRight color="#8B6BFF" size={22} />
    </TouchableOpacity>
  );
}

function SafetyRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-start">
      <View className="w-5 h-5 rounded-full bg-[#9EDD45]/15 items-center justify-center mt-0.5">
        <View className="w-2 h-2 rounded-full bg-[#9EDD45]" />
      </View>
      <Text className="text-gray-300 flex-1 ml-3 leading-5">{text}</Text>
    </View>
  );
}

function PreviewRow({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={strong ? "text-white font-semibold" : "text-gray-400"}>
        {label}
      </Text>
      <Text className={strong ? "text-[#9EDD45] font-bold" : "text-white"}>
        {value}
      </Text>
    </View>
  );
}
