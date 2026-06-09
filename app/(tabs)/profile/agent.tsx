import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle,
  CreditCard,
  DollarSign,
  Search,
  Send,
  Share2,
  Shield,
  Users,
  X,
} from "lucide-react-native";

import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  AgentPayoutMethod,
  useAddAgentPayoutMethodMutation,
  useGetAgentCommissionsQuery,
  useGetAgentDashboardQuery,
  useGetAgentPayoutMethodsQuery,
  useGetAgentPayoutRequestsQuery,
  useRequestAgentPayoutMutation,
} from "@/redux/api/agentsApiSlice";
import { getApiErrorMessage } from "@/utils/api";

function normalizeCurrency(value?: unknown) {
  return String(value || "NGN").split(/[\s-]/)[0] || "NGN";
}

function money(value?: unknown, currency?: unknown) {
  const amount = Number(value || 0);
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      currency: code,
      maximumFractionDigits: amount % 1 ? 2 : 0,
      style: "currency",
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}

function rowsFrom<T>(payload: any): T[] {
  const body = payload?.body;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.result)) return body.result;
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

function formatStatus(value?: string | null) {
  return String(value || "PENDING").toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AgentScreen() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [methodForm, setMethodForm] = useState({
    account_name: "",
    account_number: "",
    bank_code: "",
    bank_name: "",
    currency: "NGN",
  });
  const [payoutAmount, setPayoutAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetAgentDashboardQuery();
  const { data: commissionsData, isFetching: commissionsFetching } =
    useGetAgentCommissionsQuery({
      page: 1,
      search: submittedSearch,
      size: 12,
      status,
    });
  const {
    data: payoutMethodsData,
    isFetching: methodsFetching,
    refetch: refetchMethods,
  } = useGetAgentPayoutMethodsQuery();
  const {
    data: payoutRequestsData,
    isFetching: payoutRequestsFetching,
    refetch: refetchPayouts,
  } = useGetAgentPayoutRequestsQuery({ page: 1, size: 8 });

  const [addMethod, { isLoading: isAddingMethod }] =
    useAddAgentPayoutMethodMutation();
  const [requestPayout, { isLoading: isRequestingPayout }] =
    useRequestAgentPayoutMutation();

  const dashboard = data?.body || {};
  const agent = dashboard.agent;
  const metrics = dashboard.metrics || {};
  const codes = agent?.codes || [];
  const primaryCode = codes[0]?.code;
  const currency = normalizeCurrency(agent?.currency || "NGN");
  const commissions = rowsFrom<any>(commissionsData);
  const payoutMethods = Array.isArray(payoutMethodsData?.body)
    ? payoutMethodsData.body
    : [];
  const payoutRequests = rowsFrom<any>(payoutRequestsData);
  const selectedMethod =
    payoutMethods.find((method) => method.id === selectedMethodId) ||
    payoutMethods[0];

  const cards = useMemo(
    () => [
      {
        icon: <DollarSign color="white" size={19} />,
        label: "Available",
        value: money(metrics.availableBalance, currency),
      },
      {
        icon: <Shield color="#020e1e" size={19} />,
        label: "Pending",
        value: money(metrics.pendingCommission, currency),
      },
      {
        icon: <CreditCard color="white" size={19} />,
        label: "Paid",
        value: money(metrics.paidCommission, currency),
      },
      {
        icon: <Users color="#020e1e" size={19} />,
        label: "Uses",
        value: Number(metrics.redemptions || 0).toLocaleString(),
      },
    ],
    [currency, metrics]
  );

  const refreshAll = () => {
    refetch();
    refetchMethods();
    refetchPayouts();
  };

  const submitSearch = () => {
    setSubmittedSearch(search.trim());
  };

  const shareCode = async () => {
    if (!primaryCode) return;
    await Share.share({
      message: `Use my GatherPlux agent code: ${primaryCode}`,
    });
  };

  const updateMethodForm = (key: keyof typeof methodForm, value: string) => {
    setMethodForm((current) => ({ ...current, [key]: value }));
  };

  const resetMethodForm = () => {
    setMethodForm({
      account_name: "",
      account_number: "",
      bank_code: "",
      bank_name: "",
      currency: currency || "NGN",
    });
    setMethodModalOpen(false);
  };

  const saveMethod = async () => {
    if (!methodForm.account_name || methodForm.account_number.length < 4) {
      Alert.alert("Account required", "Enter an account name and valid account number.");
      return;
    }

    try {
      await addMethod({
        ...methodForm,
        currency: methodForm.currency || currency,
      }).unwrap();
      resetMethodForm();
      refetchMethods();
      Alert.alert("Saved", "Payout method saved.");
    } catch (error) {
      Alert.alert(
        "Could not save method",
        getApiErrorMessage(error, "Please try again.")
      );
    }
  };

  const submitPayout = async () => {
    const amount = Number(payoutAmount || 0);
    const available = Number(metrics.availableBalance || 0);

    if (!selectedMethod) {
      Alert.alert("Payout method required", "Add a payout method first.");
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert("Amount required", "Enter a payout amount.");
      return;
    }
    if (amount > available) {
      Alert.alert("Amount too high", "Requested payout exceeds available balance.");
      return;
    }

    try {
      await requestPayout({
        amount,
        currency: selectedMethod.currency || currency,
        payout_method_id: selectedMethod.id,
      }).unwrap();
      setPayoutAmount("");
      setPayoutModalOpen(false);
      refreshAll();
      Alert.alert("Submitted", "Payout request submitted.");
    } catch (error) {
      Alert.alert(
        "Could not request payout",
        getApiErrorMessage(error, "Please try again.")
      );
    }
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading}
      title="Agent workspace"
      subtitle="Track codes, commissions, payout methods, and payout requests."
      stats={agent ? cards.map((card) => ({ label: card.label, value: card.value })) : []}
    >
      {!agent && !isLoading ? (
        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-7">
          <Shield color="#8B6BFF" size={42} />
          <Text className="text-white text-2xl font-bold mt-4">
            No agent profile yet
          </Text>
          <Text className="text-gray-400 leading-6 mt-2">
            An admin must create your agent profile and assign a code before
            this dashboard starts tracking commissions.
          </Text>
        </View>
      ) : null}

      {agent ? (
        <>
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mb-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase">
                  Agent code
                </Text>
                <Text className="text-white text-3xl font-bold mt-2">
                  {primaryCode || "No code"}
                </Text>
                <Text className="text-gray-400 mt-2">
                  Share this code with buyers so eligible paid-ticket sales can
                  attribute platform-fee commission to you.
                </Text>
              </View>
              {primaryCode ? (
                <TouchableOpacity
                  className="bg-primary rounded-xl p-3"
                  onPress={shareCode}
                >
                  <Share2 color="#020e1e" size={20} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="bg-primary rounded-xl px-4 py-4 flex-1 flex-row items-center justify-center disabled:opacity-40"
              disabled={!payoutMethods.length || Number(metrics.availableBalance || 0) <= 0}
              onPress={() => setPayoutModalOpen(true)}
            >
              <Send color="#020e1e" size={18} />
              <Text className="text-background font-bold ml-2">Request payout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#111823] border border-[#243044] rounded-xl px-4 py-4 flex-row items-center justify-center"
              onPress={() => setMethodModalOpen(true)}
            >
              <Banknote color="#9EDD45" size={18} />
              <Text className="text-white font-bold ml-2">Add method</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-xl font-semibold">
                Commission history
              </Text>
              <Text className="text-gray-400 mt-1">
                Buyer details are masked for privacy and fraud protection.
              </Text>

              <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center mt-4">
                <Search color="#8B6BFF" size={18} />
                <TextInput
                  className="flex-1 text-white py-3 ml-2"
                  placeholder="Search code, event, ticket"
                  placeholderTextColor="#728097"
                  returnKeyType="search"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={submitSearch}
                />
                <TouchableOpacity
                  className="bg-primary rounded-lg px-3 py-2"
                  onPress={submitSearch}
                >
                  <Text className="text-background font-bold">Go</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
              >
                {[
                  ["", "All"],
                  ["PENDING", "Pending"],
                  ["APPROVED", "Approved"],
                  ["PAID", "Paid"],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value || "all"}
                    className={`rounded-full px-4 py-2 mr-2 border ${
                      status === value
                        ? "bg-primary border-primary"
                        : "bg-[#1A2432] border-[#2E3A4D]"
                    }`}
                    onPress={() => setStatus(value)}
                  >
                    <Text
                      className={
                        status === value
                          ? "text-background font-bold"
                          : "text-white font-semibold"
                      }
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {commissionsFetching ? (
              <View className="py-3">
                <ActivityIndicator color="#9EDD45" />
              </View>
            ) : null}

            {commissions.length ? (
              commissions.map((commission) => (
                <View
                  key={commission.id}
                  className="p-4 border-b border-[#243044]"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-bold">
                        {commission.event?.title || "Paid ticket"}
                      </Text>
                      <Text className="text-gray-400 mt-1">
                        {commission.ticket?.name || "Ticket"} • Code{" "}
                        {commission.code || primaryCode}
                      </Text>
                      <Text className="text-gray-500 mt-1">
                        {commission.buyer_name_masked || "Buyer"} •{" "}
                        {commission.buyer_email_masked || "hidden"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary font-bold">
                        {money(commission.commission_amount, currency)}
                      </Text>
                      <Text
                        className={`rounded-full px-3 py-1 text-xs font-bold mt-2 ${
                          formatStatus(commission.status) === "PAID"
                            ? "bg-primary text-background"
                            : formatStatus(commission.status) === "APPROVED"
                              ? "bg-[#5B4DFF]/20 text-[#A993FF]"
                              : "bg-white/10 text-gray-300"
                        }`}
                      >
                        {formatStatus(commission.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 p-5">No commission records yet.</Text>
            )}
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mt-5">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-xl font-semibold">
                Payout methods
              </Text>
              <Text className="text-gray-400 mt-1">
                Saved destinations for approved commission payouts.
              </Text>
            </View>
            {methodsFetching ? (
              <View className="py-3">
                <ActivityIndicator color="#9EDD45" />
              </View>
            ) : null}
            {payoutMethods.length ? (
              payoutMethods.map((method) => (
                <MethodRow
                  key={method.id}
                  method={method}
                  selected={selectedMethod?.id === method.id}
                  onPress={() => setSelectedMethodId(method.id)}
                />
              ))
            ) : (
              <Text className="text-gray-400 p-5">
                No payout methods saved yet.
              </Text>
            )}
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mt-5">
            <View className="p-4 border-b border-[#243044]">
              <Text className="text-white text-xl font-semibold">
                Payout requests
              </Text>
              <Text className="text-gray-400 mt-1">
                Recent requests from your approved commission balance.
              </Text>
            </View>
            {payoutRequestsFetching ? (
              <View className="py-3">
                <ActivityIndicator color="#9EDD45" />
              </View>
            ) : null}
            {payoutRequests.length ? (
              payoutRequests.map((request) => (
                <View key={request.id} className="p-4 border-b border-[#243044]">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-bold">
                        {money(request.amount, request.currency || currency)}
                      </Text>
                      <Text className="text-gray-400 mt-1">
                        {formatDate(request.created_at)}
                      </Text>
                    </View>
                    <Text className="bg-white/10 rounded-full px-3 py-1 text-gray-200 text-xs font-bold">
                      {formatStatus(request.status)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 p-5">No payout requests yet.</Text>
            )}
          </View>
        </>
      ) : null}

      <Modal visible={methodModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#111823] border border-[#243044] rounded-t-3xl overflow-hidden">
            <View className="p-5 border-b border-[#243044] flex-row justify-between items-center">
              <View>
                <Text className="text-white text-xl font-semibold">
                  Payout method
                </Text>
                <Text className="text-gray-400 mt-1">
                  Add the bank account for commission payouts.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMethodModalOpen(false)}>
                <X color="#E5E7EB" size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {(
                [
                  ["account_name", "Account name"],
                  ["account_number", "Account number"],
                  ["bank_name", "Bank name"],
                  ["bank_code", "Bank code"],
                  ["currency", "Currency"],
                ] as Array<[keyof typeof methodForm, string]>
              ).map(([key, label]) => (
                <View key={key} className="mb-4">
                  <Text className="text-gray-300 font-semibold mb-2">{label}</Text>
                  <TextInput
                    className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white"
                    placeholder={label}
                    placeholderTextColor="#728097"
                    keyboardType={key === "account_number" ? "number-pad" : "default"}
                    autoCapitalize={key === "currency" ? "characters" : "words"}
                    value={methodForm[key]}
                    onChangeText={(value) =>
                      updateMethodForm(
                        key,
                        key === "currency" ? value.toUpperCase() : value
                      )
                    }
                  />
                </View>
              ))}
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 disabled:opacity-50"
                disabled={isAddingMethod}
                onPress={saveMethod}
              >
                <View className="flex-row items-center justify-center">
                  {isAddingMethod ? (
                    <ActivityIndicator color="#020e1e" />
                  ) : (
                    <CheckCircle color="#020e1e" size={18} />
                  )}
                  <Text className="text-background font-bold ml-2">
                    Save method
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={payoutModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#111823] border border-[#243044] rounded-t-3xl overflow-hidden">
            <View className="p-5 border-b border-[#243044] flex-row justify-between items-center">
              <View>
                <Text className="text-white text-xl font-semibold">
                  Request payout
                </Text>
                <Text className="text-gray-400 mt-1">
                  Available: {money(metrics.availableBalance, currency)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPayoutModalOpen(false)}>
                <X color="#E5E7EB" size={22} />
              </TouchableOpacity>
            </View>
            <View className="p-5">
              <Text className="text-gray-300 font-semibold mb-2">Method</Text>
              <View className="mb-4">
                {payoutMethods.map((method) => (
                  <MethodRow
                    key={method.id}
                    method={method}
                    selected={selectedMethod?.id === method.id}
                    onPress={() => setSelectedMethodId(method.id)}
                  />
                ))}
              </View>
              <Text className="text-gray-300 font-semibold mb-2">Amount</Text>
              <TextInput
                className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 text-white mb-5"
                keyboardType="decimal-pad"
                placeholder="Amount"
                placeholderTextColor="#728097"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
              />
              <TouchableOpacity
                className="bg-primary rounded-xl py-4 disabled:opacity-50"
                disabled={isRequestingPayout}
                onPress={submitPayout}
              >
                <View className="flex-row items-center justify-center">
                  {isRequestingPayout ? (
                    <ActivityIndicator color="#020e1e" />
                  ) : (
                    <ArrowUpRight color="#020e1e" size={18} />
                  )}
                  <Text className="text-background font-bold ml-2">
                    Submit payout request
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ProfileFoundationScreen>
  );
}

function MethodRow({
  method,
  onPress,
  selected,
}: {
  method: AgentPayoutMethod;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <TouchableOpacity
      className={`p-4 border-b border-[#243044] flex-row items-center ${
        selected ? "bg-primary/10" : ""
      }`}
      onPress={onPress}
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center ${selected ? "bg-primary" : "bg-[#1A2432]"}`}>
        <Banknote color={selected ? "#020e1e" : "#9EDD45"} size={18} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-white font-semibold">
          {method.bank_name || "Bank account"}
        </Text>
        <Text className="text-gray-400 mt-1">
          {method.account_name || "Account"} • ending{" "}
          {method.account_number_last4 || "----"} •{" "}
          {normalizeCurrency(method.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
