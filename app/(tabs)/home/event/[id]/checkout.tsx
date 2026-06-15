import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  useRouter,
  useLocalSearchParams,
  RelativePathString,
} from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Minus,
  Plus,
  Ticket,
  Calendar,
} from "lucide-react-native";
import { useSelector } from "react-redux";
import { useGetEventQuery } from "@/redux/api/eventsApiSlice";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  currencySymbol,
  getTicketRemainingQuantity,
  getUpcomingSessions,
} from "@/utils/eventHelpers";

interface AttendeeDetails {
  fullname: string;
  email: string;
  phone: string;
  dob?: string;
}

interface TicketSelection {
  quantity: number;
  sessionId: number | string;
}

const getUserName = (userInfo: any) =>
  userInfo?.profile?.name ||
  userInfo?.name ||
  userInfo?.fullname ||
  userInfo?.firstname ||
  "";

const getUserEmail = (userInfo: any) =>
  userInfo?.profile?.email || userInfo?.email || userInfo?.username || "";

const getUserPhone = (userInfo: any) =>
  userInfo?.profile?.phone || userInfo?.phone || "";

const calculateAge = (dob?: string) => {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const beforeBirthday =
    today.getMonth() < parsed.getMonth() ||
    (today.getMonth() === parsed.getMonth() &&
      today.getDate() < parsed.getDate());

  if (beforeBirthday) age -= 1;
  return age;
};

const formatDateForPayload = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDobDate = (value?: string) => {
  if (!value) return new Date(2000, 0, 1);
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(2000, 0, 1) : parsed;
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ticketData: any = useMemo(() => {
    try {
      return JSON.parse(String(data || "{}"));
    } catch {
      return {};
    }
  }, [data]);
  const { userInfo } = useSelector((state: any) => state.auth);
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery({ id: ticketData?.eventId, user_id: userInfo?.sub });
  const eventBody = event?.body || {};
  const availableTickets = Array.isArray(eventBody?.tickets)
    ? eventBody.tickets
    : [];
  const upcomingSessions = getUpcomingSessions(
    Array.isArray(eventBody?.sessions) ? eventBody.sessions : []
  );
  const symbol = currencySymbol(eventBody?.currency || ticketData?.currency);
  const routeTicketInstances = useMemo(
    () =>
      Array.isArray(ticketData?.ticketInstances)
        ? ticketData.ticketInstances
        : [],
    [ticketData?.ticketInstances]
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const ageLimit = Number(
    eventBody?.age_restriction || ticketData?.age_restriction || 0
  );
  const guardianRequired = Boolean(
    eventBody?.guardian_required ?? ticketData?.guardian_required
  );
  const [ticketSelections, setTicketSelections] = useState<
    Record<number, TicketSelection>
  >(() =>
    routeTicketInstances.reduce((acc: Record<number, TicketSelection>, instance: any) => {
      const ticketId = Number(instance?.ticketId);
      if (!ticketId) return acc;
      const current = acc[ticketId] || {
        quantity: 0,
        sessionId: instance?.sessionId || "",
      };
      acc[ticketId] = {
        quantity: current.quantity + 1,
        sessionId: current.sessionId || instance?.sessionId || "",
      };
      return acc;
    }, {})
  );
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [dobPickerTarget, setDobPickerTarget] = useState<"common" | number | null>(
    null
  );

  const [useCommonDetails, setUseCommonDetails] = useState(
    !eventBody?.each_ticket_identity
  );
  const [commonDetails, setCommonDetails] = useState<AttendeeDetails>({
    fullname: getUserName(userInfo),
    email: getUserEmail(userInfo),
    phone: getUserPhone(userInfo),
    ...(ageLimit && { dob: "" }),
  });

  const [attendeeDetails, setAttendeeDetails] = useState<AttendeeDetails[]>(
    Array(routeTicketInstances.length).fill({
      fullname: "",
      email: "",
      phone: "",
      ...(ageLimit && { dob: "" }),
    })
  );

  const selectedTicketInstances = useMemo(() => {
    if (!availableTickets.length && routeTicketInstances.length > 0) {
      return routeTicketInstances;
    }

    const validSessionIds = new Set(
      upcomingSessions.map((session: any) => String(session.id))
    );

    return availableTickets.flatMap((ticket: any) => {
      const ticketId = Number(ticket.id);
      const selection = ticketSelections[ticketId];
      const quantity = Number(selection?.quantity || 0);
      if (quantity <= 0) return [];

      const sessionId =
        selection?.sessionId || (upcomingSessions.length === 1 ? upcomingSessions[0].id : "");
      if (!sessionId || !validSessionIds.has(String(sessionId))) return [];

      return Array.from({ length: quantity }, () => ({
        ticketId,
        sessionId,
        price: Number(ticket.price || 0),
        name: ticket.name || "Ticket",
      }));
    });
  }, [availableTickets, routeTicketInstances, ticketSelections, upcomingSessions]);

  const selectedQuantityTotal = Object.values(ticketSelections).reduce(
    (sum, selection) => sum + Number(selection?.quantity || 0),
    0
  );
  const selectedTicketsTotal = selectedTicketInstances.reduce(
    (sum: number, instance: any) => sum + Number(instance.price || 0),
    0
  );
  const hasTicketSelection = selectedQuantityTotal > 0;
  const hasValidTicketSessions =
    hasTicketSelection && selectedTicketInstances.length === selectedQuantityTotal;

  const handleAddTicket = (ticket: any) => {
    const ticketId = Number(ticket.id);
    const remaining = getTicketRemainingQuantity(ticket);
    if (!ticketId || remaining <= 0) return;

    setTicketSelections((prev) => {
      const current = prev[ticketId] || {
        quantity: 0,
        sessionId: upcomingSessions[0]?.id || "",
      };

      return {
        ...prev,
        [ticketId]: {
          ...current,
          quantity: Math.min(remaining, current.quantity + 1),
          sessionId: current.sessionId || upcomingSessions[0]?.id || "",
        },
      };
    });
  };

  const handleRemoveTicket = (ticket: any) => {
    const ticketId = Number(ticket.id);
    if (!ticketId) return;

    setTicketSelections((prev) => {
      const current = prev[ticketId];
      if (!current || current.quantity <= 0) return prev;

      return {
        ...prev,
        [ticketId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      };
    });
  };

  const handleSessionChange = (ticketId: number, sessionId: number | string) => {
    setTicketSelections((prev) => ({
      ...prev,
      [ticketId]: {
        quantity: prev[ticketId]?.quantity || 0,
        sessionId,
      },
    }));
  };

  const activeDobValue =
    dobPickerTarget === "common"
      ? commonDetails.dob
      : typeof dobPickerTarget === "number"
      ? attendeeDetails[dobPickerTarget]?.dob
      : "";

  const handleConfirmDob = (date: Date) => {
    const dob = formatDateForPayload(date);
    if (dobPickerTarget === "common") {
      setCommonDetails((prev) => ({ ...prev, dob }));
    } else if (typeof dobPickerTarget === "number") {
      setAttendeeDetails((prev) => {
        const next = [...prev];
        next[dobPickerTarget] = {
          ...next[dobPickerTarget],
          dob,
        };
        return next;
      });
    }
    setDobPickerTarget(null);
  };

  useEffect(() => {
    if (eventBody) {
      setUseCommonDetails(!eventBody.each_ticket_identity);
    }
  }, [eventBody?.each_ticket_identity]);

  useEffect(() => {
    setCommonDetails((prev) => ({
      ...prev,
      fullname: prev.fullname || getUserName(userInfo),
      email: prev.email || getUserEmail(userInfo),
      phone: prev.phone || getUserPhone(userInfo),
      ...(ageLimit && { dob: prev.dob || "" }),
    }));
    setAttendeeDetails((prev) =>
      selectedTicketInstances.map((_: any, index: number) => ({
        fullname: prev[index]?.fullname || "",
        email: prev[index]?.email || "",
        phone: prev[index]?.phone || "",
        ...(ageLimit && { dob: prev[index]?.dob || "" }),
      }))
    );
  }, [ageLimit, selectedTicketInstances.length, userInfo]);

  // Validate form whenever details change
  useEffect(() => {
    validateForm();
  }, [
    ageLimit,
    attendeeDetails,
    commonDetails,
    guardianConfirmed,
    guardianRequired,
    useCommonDetails,
  ]);

  const validateForm = () => {
    const detailsAreValid = (attendee: AttendeeDetails) => {
      const age = calculateAge(attendee.dob);
      return (
        attendee.fullname.trim() !== "" &&
        attendee.email.trim() !== "" &&
        attendee.phone.trim() !== "" &&
        (!ageLimit || (Boolean(attendee.dob) && age !== null && age >= ageLimit))
      );
    };

    if (useCommonDetails) {
      setIsFormValid(
        hasValidTicketSessions &&
        detailsAreValid(commonDetails) &&
          (!guardianRequired || guardianConfirmed)
      );
    } else {
      setIsFormValid(
        hasValidTicketSessions &&
          attendeeDetails.length === selectedTicketInstances.length &&
        attendeeDetails.every(detailsAreValid) &&
          (!guardianRequired || guardianConfirmed)
      );
    }
  };
  const handleContinue = () => {
    if (!hasTicketSelection) {
      Alert.alert("Choose tickets", "Select at least one ticket before continuing.");
      return;
    }
    if (!hasValidTicketSessions) {
      Alert.alert("Choose a session", "Every selected ticket needs an upcoming session.");
      return;
    }
    if (!isFormValid) return;

    const bookings = useCommonDetails
      ? selectedTicketInstances.map((instance: any) => ({
          ...commonDetails,
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name: instance.name,
          price: instance.price,
          receive_updates: receiveUpdates,
        }))
      : selectedTicketInstances.map((instance: any, index: any) => ({
          ...attendeeDetails[index],
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name: instance.name,
          price: instance.price,
          receive_updates: receiveUpdates,
        }));

    const bookingData = {
      absorb_fee: Boolean(ticketData?.absorb_fee),
      age_restriction: ageLimit,
      attendance_mode: eventBody?.attendance_mode || ticketData?.attendance_mode,
      event_id: Number(ticketData.eventId),
      currency: eventBody?.currency || ticketData?.currency,
      channel: "PayStack",
      guardian_required: guardianRequired,
      online_url_reveal: eventBody?.online_url_reveal || ticketData?.online_url_reveal,
      receive_updates: receiveUpdates,
      bookings,
    };

    router.push({
      pathname:
        `/home/event/${ticketData?.eventId}/summary` as RelativePathString,
      params: { data: JSON.stringify(bookingData) },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#9EDD45" />
        <Text className="text-white mt-4">Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-4">
        <Text className="text-white text-center mb-4">
          Failed to load event details
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg px-6 py-3"
          onPress={() => refetch()}
        >
          <Text className="text-background">Try Again</Text>
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
        <Text className="text-white text-xl font-semibold">Attendee Details</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-5">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center">
                <Ticket color="#9EDD45" size={18} />
                <Text className="text-white text-lg font-bold ml-2">
                  Choose tickets
                </Text>
              </View>
              <Text className="text-gray-400 text-sm mt-1">
                Select ticket type, quantity, and session before attendee details.
              </Text>
            </View>
            <View className="bg-[#223044] rounded-full px-3 py-1">
              <Text className="text-primary text-xs font-bold">
                {selectedQuantityTotal} selected
              </Text>
            </View>
          </View>

          {availableTickets.length > 0 ? (
            <View className="gap-3">
              {availableTickets.map((ticket: any) => {
                const ticketId = Number(ticket.id);
                const remaining = getTicketRemainingQuantity(ticket);
                const selectedQuantity = Number(ticketSelections[ticketId]?.quantity || 0);
                const selectedSessionId = ticketSelections[ticketId]?.sessionId || "";
                const soldOut = remaining <= 0;

                return (
                  <View
                    key={ticket.id}
                    className="rounded-2xl border border-[#2E3A4D] bg-[#1A2432] p-3"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-white font-bold">{ticket.name}</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {remaining} remaining
                        </Text>
                      </View>
                      <Text className="text-primary font-bold">
                        {Number(ticket.price || 0) === 0
                          ? "Free"
                          : `${symbol} ${Number(ticket.price || 0).toLocaleString()}`}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-3">
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          className={`h-10 w-10 rounded-full border items-center justify-center ${
                            selectedQuantity <= 0
                              ? "border-[#2E3A4D] opacity-40"
                              : "border-[#3A4A61] bg-[#111823]"
                          }`}
                          disabled={selectedQuantity <= 0}
                          onPress={() => handleRemoveTicket(ticket)}
                        >
                          <Minus color="#FFFFFF" size={16} />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-base mx-4 min-w-[18px] text-center">
                          {selectedQuantity}
                        </Text>
                        <TouchableOpacity
                          className={`h-10 w-10 rounded-full border items-center justify-center ${
                            soldOut || selectedQuantity >= remaining
                              ? "border-[#2E3A4D] opacity-40"
                              : "border-primary bg-primary"
                          }`}
                          disabled={soldOut || selectedQuantity >= remaining}
                          onPress={() => handleAddTicket(ticket)}
                        >
                          <Plus
                            color={soldOut || selectedQuantity >= remaining ? "#FFFFFF" : "#020E1E"}
                            size={16}
                          />
                        </TouchableOpacity>
                      </View>

                      {soldOut ? (
                        <Text className="text-red-300 text-xs font-bold">Sold out</Text>
                      ) : null}
                    </View>

                    {selectedQuantity > 0 && upcomingSessions.length > 1 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mt-3"
                      >
                        {upcomingSessions.map((session: any) => {
                          const active = String(selectedSessionId) === String(session.id);
                          return (
                            <TouchableOpacity
                              key={session.id}
                              className={`mr-2 rounded-full border px-3 py-2 ${
                                active
                                  ? "bg-primary border-primary"
                                  : "bg-[#111823] border-[#2E3A4D]"
                              }`}
                              onPress={() => handleSessionChange(ticketId, session.id)}
                            >
                              <Text
                                className={`text-xs font-bold ${
                                  active ? "text-background" : "text-gray-300"
                                }`}
                              >
                                {session.name || "Session"} {session.start_time || ""}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="rounded-2xl border border-[#2E3A4D] bg-[#1A2432] p-4">
              <Text className="text-gray-300 font-semibold">Tickets unavailable</Text>
              <Text className="text-gray-500 text-sm mt-1">
                This event does not have bookable tickets right now.
              </Text>
            </View>
          )}

          {hasTicketSelection && !hasValidTicketSessions ? (
            <Text className="text-amber-300 text-xs font-semibold mt-3">
              Select an upcoming session for every chosen ticket.
            </Text>
          ) : null}

          <View className="h-[1px] bg-[#243044] my-4" />
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Ticket subtotal</Text>
            <Text className="text-white font-bold">
              {symbol} {selectedTicketsTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <TouchableOpacity
            className={`p-4 rounded-lg mb-4 ${
              useCommonDetails ? "bg-primary" : "bg-[#1A2432]"
            }`}
            onPress={() => setUseCommonDetails(true)}
          >
            <Text
              className={useCommonDetails ? "text-background" : "text-white"}
            >
              Use same details for all tickets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg ${
              !useCommonDetails ? "bg-primary" : "bg-[#1A2432]"
            }`}
            onPress={() => setUseCommonDetails(false)}
          >
            <Text
              className={!useCommonDetails ? "text-background" : "text-white"}
            >
              Add individual details for each ticket
            </Text>
          </TouchableOpacity>
        </View>

        {useCommonDetails ? (
          <View className="space-y-4">
            <View>
              <Text className="text-white mb-2">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                  !commonDetails.fullname
                    ? "border-red-500"
                    : "border-transparent"
                }`}
              >
                <User size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter full name*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.fullname}
                  onChangeText={(text) =>
                    setCommonDetails({ ...commonDetails, fullname: text })
                  }
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">
                Email <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                  !commonDetails.email ? "border-red-500" : "border-transparent"
                }`}
              >
                <Mail size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter email*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.email}
                  onChangeText={(text) =>
                    setCommonDetails({ ...commonDetails, email: text })
                  }
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">
                Phone <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                  !commonDetails.phone ? "border-red-500" : "border-transparent"
                }`}
              >
                <Phone size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter phone number*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.phone}
                  onChangeText={(text) =>
                    setCommonDetails({ ...commonDetails, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {ageLimit > 0 && (
              <View>
                <Text className="text-white mb-2">
                  Date of Birth <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setDobPickerTarget("common")}
                  className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                    !commonDetails.dob ? "border-red-500" : "border-transparent"
                  }`}
                >
                  <Calendar color="#6B7280" size={20} />
                  <Text
                    className={`flex-1 ml-3 text-xl py-3 ${
                      commonDetails.dob ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {commonDetails.dob || "Select date of birth"}
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-400 text-sm mt-1">
                  Tap to choose a valid birth date.
                </Text>
              </View>
            )}
          </View>
        ) : (
          selectedTicketInstances.map((instance: any, index: any) => (
            <View key={index} className="mb-6">
              <View className="bg-[#4d6382] rounded-lg p-4 mb-4">
                <Text className="text-white">Ticket {index + 1}</Text>
                <Text className="text-gray-400">
                  Session:
                  {
                    eventBody?.sessions?.find(
                      (s) => s.id === instance.sessionId
                    )?.name
                  }
                  {
                    eventBody?.sessions?.find(
                      (s) => s.id === instance.sessionId
                    )?.start_time
                  }
                  {
                    eventBody?.sessions?.find(
                      (s) => s.id === instance.sessionId
                    )?.end_time
                  }
                </Text>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-white mb-2">
                    Full Name <Text className="text-red-500">*</Text>
                  </Text>
                  <View
                    className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                      !attendeeDetails[index].fullname
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                  >
                    <User size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2 "
                      placeholder="Enter full name*"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].fullname}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {
                          ...attendeeDetails[index],
                          fullname: text,
                        };
                        setAttendeeDetails(newDetails);
                      }}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white mb-2">
                    Email <Text className="text-red-500">*</Text>
                  </Text>
                  <View
                    className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                      !attendeeDetails[index].email
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                  >
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2"
                      placeholder="Enter email*"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].email}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {
                          ...attendeeDetails[index],
                          email: text,
                        };
                        setAttendeeDetails(newDetails);
                      }}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white mb-2">
                    Phone <Text className="text-red-500">*</Text>
                  </Text>
                  <View
                    className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                      !attendeeDetails[index].phone
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                  >
                    <Phone size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2"
                      placeholder="Enter phone number*"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].phone}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {
                          ...attendeeDetails[index],
                          phone: text,
                        };
                        setAttendeeDetails(newDetails);
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {ageLimit > 0 && (
                  <View>
                    <Text className="text-white mb-2">
                      Date of Birth <Text className="text-red-500">*</Text>
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setDobPickerTarget(index)}
                      className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                        !attendeeDetails[index].dob
                          ? "border-red-500"
                          : "border-transparent"
                      }`}
                    >
                      <Calendar color="#6B7280" size={20} />
                      <Text
                        className={`flex-1 ml-3 text-xl py-3 ${
                          attendeeDetails[index].dob ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {attendeeDetails[index].dob || "Select date of birth"}
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-sm mt-1">
                      Tap to choose a valid birth date.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View className="bg-[#1A2432] rounded-lg p-4 my-6">
          {(ageLimit > 0 || guardianRequired) && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">
                Booking rules
              </Text>
              {ageLimit > 0 && (
                <Text className="text-gray-400 text-sm leading-6">
                  Attendees must be at least {ageLimit} years old. Choose each
                  attendee's date of birth before checkout.
                </Text>
              )}
              {guardianRequired && (
                <TouchableOpacity
                  className="flex-row items-start mt-3"
                  onPress={() => setGuardianConfirmed((prev) => !prev)}
                >
                  <Text className="text-primary font-bold mr-3">
                    [{guardianConfirmed ? "x" : " "}]
                  </Text>
                  <Text className="text-gray-300 flex-1">
                    I confirm a guardian aged 18 or older will be present.
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            className="flex-row items-start"
            onPress={() => setReceiveUpdates((prev) => !prev)}
          >
            <Text className="text-primary font-bold mr-3">
              [{receiveUpdates ? "x" : " "}]
            </Text>
            <View className="flex-1">
              <Text className="text-white font-semibold">Receive updates</Text>
              <Text className="text-gray-400 text-sm mt-1 leading-6">
                Send booking and event updates to the attendee email address.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`rounded-lg py-4 ${
            isFormValid ? "bg-primary" : "bg-gray-500"
          }`}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text className="text-background text-center font-semibold">
            Continue to checkout
          </Text>
        </TouchableOpacity>
      </View>
      <DateTimePickerModal
        isVisible={dobPickerTarget !== null}
        mode="date"
        date={parseDobDate(activeDobValue)}
        maximumDate={new Date()}
        onConfirm={handleConfirmDob}
        onCancel={() => setDobPickerTarget(null)}
      />
    </View>
  );
}
