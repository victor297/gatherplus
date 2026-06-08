import React, { useState, useEffect } from "react";
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
import { ArrowLeft, User, Mail, Phone } from "lucide-react-native";
import { useSelector } from "react-redux";
import { useGetEventQuery } from "@/redux/api/eventsApiSlice";

interface AttendeeDetails {
  fullname: string;
  email: string;
  phone: string;
  dob?: string;
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

export default function CheckoutScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ticketData: any = JSON.parse(data as string);
  const { userInfo } = useSelector((state: any) => state.auth);
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery({ id: ticketData?.eventId, user_id: userInfo?.sub });
  const [isFormValid, setIsFormValid] = useState(false);
  const ageLimit = Number(
    event?.body?.age_restriction || ticketData?.age_restriction || 0
  );
  const guardianRequired = Boolean(
    event?.body?.guardian_required ?? ticketData?.guardian_required
  );
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);

  const [useCommonDetails, setUseCommonDetails] = useState(
    !event?.body?.each_ticket_identity
  );
  const [commonDetails, setCommonDetails] = useState<AttendeeDetails>({
    fullname: getUserName(userInfo),
    email: getUserEmail(userInfo),
    phone: getUserPhone(userInfo),
    ...(ageLimit && { dob: "" }),
  });

  const [attendeeDetails, setAttendeeDetails] = useState<AttendeeDetails[]>(
    Array(ticketData.ticketInstances.length).fill({
      fullname: "",
      email: "",
      phone: "",
      ...(ageLimit && { dob: "" }),
    })
  );

  useEffect(() => {
    if (event?.body) {
      setUseCommonDetails(!event.body.each_ticket_identity);
    }
  }, [event?.body?.each_ticket_identity]);

  useEffect(() => {
    setCommonDetails((prev) => ({
      ...prev,
      fullname: prev.fullname || getUserName(userInfo),
      email: prev.email || getUserEmail(userInfo),
      phone: prev.phone || getUserPhone(userInfo),
      ...(ageLimit && { dob: prev.dob || "" }),
    }));
    setAttendeeDetails((prev) =>
      ticketData.ticketInstances.map((_: any, index: number) => ({
        fullname: prev[index]?.fullname || "",
        email: prev[index]?.email || "",
        phone: prev[index]?.phone || "",
        ...(ageLimit && { dob: prev[index]?.dob || "" }),
      }))
    );
  }, [ageLimit, ticketData.ticketInstances.length, userInfo]);

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
        detailsAreValid(commonDetails) &&
          (!guardianRequired || guardianConfirmed)
      );
    } else {
      setIsFormValid(
        attendeeDetails.every(detailsAreValid) &&
          (!guardianRequired || guardianConfirmed)
      );
    }
  };
  const handleContinue = () => {
    if (!isFormValid) return;

    const bookings = useCommonDetails
      ? ticketData.ticketInstances.map((instance: any) => ({
          ...commonDetails,
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name: instance.name,
          price: instance.price,
          receive_updates: receiveUpdates,
        }))
      : ticketData.ticketInstances.map((instance: any, index: any) => ({
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
      attendance_mode: ticketData?.attendance_mode,
      event_id: Number(ticketData.eventId),
      currency: ticketData?.currency,
      channel: "PayStack",
      guardian_required: guardianRequired,
      online_url_reveal: ticketData?.online_url_reveal,
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
                <View
                  className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                    !commonDetails.dob ? "border-red-500" : "border-transparent"
                  }`}
                >
                  <TextInput
                    className="flex-1 text-white text-xl py-2"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#6B7280"
                    value={commonDetails.dob}
                    onChangeText={(text) =>
                      setCommonDetails({ ...commonDetails, dob: text })
                    }
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <Text className="text-gray-400 text-sm mt-1">
                  Format: YYYY-MM-DD
                </Text>
              </View>
            )}
          </View>
        ) : (
          ticketData.ticketInstances.map((instance: any, index: any) => (
            <View key={index} className="mb-6">
              <View className="bg-[#4d6382] rounded-lg p-4 mb-4">
                <Text className="text-white">Ticket {index + 1}</Text>
                <Text className="text-gray-400">
                  Session:
                  {
                    event?.body?.sessions.find(
                      (s) => s.id === instance.sessionId
                    )?.name
                  }
                  {
                    event?.body?.sessions.find(
                      (s) => s.id === instance.sessionId
                    )?.start_time
                  }
                  {
                    event?.body?.sessions.find(
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
                    <View
                      className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${
                        !attendeeDetails[index].dob
                          ? "border-red-500"
                          : "border-transparent"
                      }`}
                    >
                      <TextInput
                        className="flex-1 text-white text-xl py-2"
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7280"
                        value={attendeeDetails[index].dob}
                        onChangeText={(text) => {
                          const newDetails = [...attendeeDetails];
                          newDetails[index] = {
                            ...attendeeDetails[index],
                            dob: text,
                          };
                          setAttendeeDetails(newDetails);
                        }}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <Text className="text-gray-400 text-sm mt-1">
                      Format: YYYY-MM-DD
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
                  Attendees must be at least {ageLimit} years old. Enter a valid
                  date of birth in YYYY-MM-DD format.
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
    </View>
  );
}
