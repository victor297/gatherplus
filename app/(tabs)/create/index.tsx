import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Calendar, Clock, ChevronDown, Plus, Wand2 } from "lucide-react-native";
import ProgressSteps from "@/app/components/create/ProgressSteps";
import {
  useGetcategoriesQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
} from "@/redux/api/eventsApiSlice";
import { useGetNewEventQuery } from "@/redux/api/newEventsApiSlice";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import { uploadSingleFile } from "@/utils/upload";
import {
  AI_EVENT_IMPORT_STORAGE_KEY,
  ATTENDANCE_MODES,
  DEFAULT_TIMEZONE,
  ONLINE_PLATFORMS,
  ONLINE_REVEAL_OPTIONS,
  RECURRING_FREQUENCIES,
  mapNewEventToMobileForm,
  needsOnline,
  needsVenue,
} from "@/utils/newEventForm";

interface Participant {
  label: string;
  title: string;
  name: string;
  description: string;
  image?: string;
  imageUploading?: boolean;
  imageError?: string;
}
interface Session {
  name: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  participants: Participant[];
}
export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const { userInfo } = useSelector((state: any) => state.auth);

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const defaultFormData = {
    title: "",
    eventCategory: "",
    category_id: "",
    summary: "",
    sessionType: "single",
    state_id: 2,
    city: "",
    country_code: "NG",
    description: "",
    images: [],
    start_date: "",
    address: "",
    currency: "",
    each_ticket_identity: true,
    price: 0,
    age_restriction: 0,
    guardian_required: false,
    is_free: false,
    event_type: "single",
    recurring_frequency: "WEEKLY",
    attendance_mode: "VENUE",
    online_platform: "ZOOM",
    online_url: "",
    online_access_instructions: "",
    online_timezone: DEFAULT_TIMEZONE,
    online_url_reveal: "AFTER_BOOKING",
    tags: "",
    faqs: [],
    door_time: "",
    parking_info: "",
    discount_info: "",
    agenda_info: "",
    time: "",
    absorb_fee: true,
    ticketed: true,
    tickets: [],
  };
  const [formData, setFormData] = useState<any>(() => {
    try {
      const incoming = params.formData ? JSON.parse(params.formData as string) : {};
      return { ...defaultFormData, ...incoming };
    } catch (error) {
      console.error("Error parsing formData:", error);
      return defaultFormData;
    }
  });
  const {
    data: editEventData,
    isLoading: editEventLoading,
  } = useGetNewEventQuery(eventId || "", {
    skip: !eventId || Boolean(params.formData),
  });
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetcategoriesQuery({});
  const {
    data: countryData,
    isLoading: countryLoading,
    error: countryError,
  } = useGetCountriesQuery({});
  const {
    data: stateData,
    isLoading: stateLoading,
    error: stateError,
  } = useGetStatesQuery(selectedCountry?.code2, {
    skip: !selectedCountry,
  });
  const [sessions, setSessions] = useState<Session[] | any>([
    {
      name: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      participants: [],
    },
  ]);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<{
    sessionIndex: number;
    field: "startTime" | "endTime" | "startDate" | "endDate";
  } | null>(null);
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = useState(false);

  const categories = categoriesData?.body || [];
  const countries = countryData?.body || [];
  const states = stateData?.body || [];

  useEffect(() => {
    if (source !== "ai" || eventId || params.formData) return;

    const importAiDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(AI_EVENT_IMPORT_STORAGE_KEY);
        if (!raw) return;

        const imported = JSON.parse(raw);
        setFormData((prev: any) => ({ ...prev, ...imported }));
        if (Array.isArray(imported.sessions) && imported.sessions.length > 0) {
          setSessions(imported.sessions);
        }
        await AsyncStorage.removeItem(AI_EVENT_IMPORT_STORAGE_KEY);
        Alert.alert("AI draft imported", "Review and complete any missing details before saving.");
      } catch (error) {
        console.error("Failed to import AI draft", error);
        Alert.alert("AI import failed", "Please generate the draft again.");
      }
    };

    importAiDraft();
  }, [eventId, params.formData, source]);

  // Validate form whenever form data changes
  useEffect(() => {
    validateForm();
  }, [formData, sessions, selectedCountry, selectedState]);

  // Check if all data is loaded
  useEffect(() => {
    if (!categoriesLoading && !countryLoading) {
      setIsLoadingData(false);
    }
  }, [categoriesLoading, countryLoading]);

  useEffect(() => {
    if (editEventData?.body && !params.formData) {
      const mapped = mapNewEventToMobileForm(editEventData.body);
      setFormData((prev: any) => ({ ...prev, ...mapped }));
      setSessions(mapped.sessions?.length ? mapped.sessions : sessions);
    }
  }, [editEventData, params.formData]);

  useEffect(() => {
    if (categories.length > 0 && formData.category_id && !formData.eventCategory) {
      const category = categories.find(
        (item: any) => Number(item.id) === Number(formData.category_id)
      );
      if (category) {
        setFormData((prev: any) => ({
          ...prev,
          eventCategory: category.name,
        }));
      }
    }
  }, [categories, formData.category_id, formData.eventCategory]);

  useEffect(() => {
    if (!selectedCountry && countries.length > 0 && formData.country_code) {
      const country = countries.find((item: any) => item.code2 === formData.country_code);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [countries, formData.country_code, selectedCountry]);

  useEffect(() => {
    if (!selectedState && states.length > 0 && formData.state_id) {
      const state = states.find((item: any) => Number(item.id) === Number(formData.state_id));
      if (state) {
        setSelectedState(state);
      }
    }
  }, [states, formData.state_id, selectedState]);

  const validateForm = () => {
    // Basic validation
    let isValid = true;

    // Event details validation
    if (!formData.title.trim()) isValid = false;
    if (!formData.eventCategory) isValid = false;
    if (!formData.summary.trim()) isValid = false;
    if (!formData.event_type) isValid = false;
    if (needsOnline(formData.attendance_mode)) {
      if (!formData.online_platform) isValid = false;
      if (!formData.online_access_instructions.trim()) isValid = false;
      if (!formData.online_timezone.trim()) isValid = false;
    }

    // Sessions validation
    if (sessions.length === 0) isValid = false;
    sessions.forEach((session: any) => {
      if (!session.name.trim()) isValid = false;
      if (!session.startDate) isValid = false;
      if (!session.endDate) isValid = false;
      if (!session.startTime) isValid = false;
      if (!session.endTime) isValid = false;
    });

    // Location validation
    if (needsVenue(formData.attendance_mode)) {
      if (!selectedCountry) isValid = false;
      if (!selectedState) isValid = false;
      if (!formData.city.trim()) isValid = false;
      if (!formData.address.trim()) isValid = false;
    }

    setIsFormValid(isValid);
  };

  const addSession = () => {
    setSessions([
      ...sessions,
      {
        name: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        participants: [],
      },
    ]);
  };
  const addParticipant = (sessionIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants.push({
      label: "",
      title: "",
      name: "",
      description: "",
      image: "",
    });
    setSessions(newSessions);
  };

  const updateParticipant = (
    sessionIndex: number,
    participantIndex: number,
    field: keyof Participant,
    value: string
  ) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants[participantIndex][field] = value;
    setSessions(newSessions);
  };
  const handleConfirmDate = (date: Date) => {
    if (activeTimeField !== null) {
      const formattedDate = date.toISOString().split("T")[0];
      const newSessions = [...sessions];

      // Update the selected field
      newSessions[activeTimeField.sessionIndex] = {
        ...newSessions[activeTimeField.sessionIndex],
        [activeTimeField.field]: formattedDate,
      };

      // If we're setting the start date and end date is empty, set end date to same as start date
      if (
        activeTimeField.field === "startDate" &&
        !newSessions[activeTimeField.sessionIndex].endDate
      ) {
        newSessions[activeTimeField.sessionIndex].endDate = formattedDate;
      }

      setSessions(newSessions);
    }
    setShowDatePicker(false);
  };

  const handleConfirmTime = (time: Date) => {
    if (activeTimeField !== null) {
      const formattedTime = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      updateSession(
        activeTimeField.sessionIndex,
        activeTimeField.field,
        formattedTime
      );
    }
    setShowTimePicker(false);
  };

  const updateSession = (
    index: number,
    field: keyof Session,
    value: string
  ) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setSessions(newSessions);
  };

  const addFaq = () => {
    setFormData((prev: any) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    const faqs = [...(formData.faqs || [])];
    faqs[index] = { ...faqs[index], [field]: value };
    setFormData({ ...formData, faqs });
  };

  const removeFaq = (index: number) => {
    const faqs = [...(formData.faqs || [])];
    faqs.splice(index, 1);
    setFormData({ ...formData, faqs });
  };

  const handleSaveAndContinue = () => {
    if (!isFormValid) return;

    router.push({
      pathname: "/create/banner",
      params: {
        formData: JSON.stringify({
          ...formData,
          event_type:
            String(formData.event_type).toLowerCase() === "recurring"
              ? "RECURRING"
              : "SINGLE",
          attendance_mode: formData.attendance_mode,
          sessions: sessions.map((session: any) => ({
            name: session.name,
            date: session.startDate,
            end_date: session.endDate,
            start_time: session.startTime,
            end_time: session.endTime,
            participants: session.participants.map(
              ({ imageUploading, ...rest }: any) => rest
            ),
          })),
        }),
        eventId: eventId || "",
      },
    });
  };

  const removeSession = (index: number) => {
    if (sessions.length > 1) {
      // Don't allow removing the last session
      const newSessions = [...sessions];
      newSessions.splice(index, 1);
      setSessions(newSessions);
    } else {
      Alert.alert("Cannot remove", "You need at least one session");
    }
  };

  const removeParticipant = (
    sessionIndex: number,
    participantIndex: number
  ) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants.splice(participantIndex, 1);
    setSessions(newSessions);
  };

  const uploadParticipantImage = async (
    sessionIndex: number,
    participantIndex: number,
    imageUri: string
  ) => {
    // Update state to show uploading status
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants[participantIndex].imageUploading =
      true;
    newSessions[sessionIndex].participants[participantIndex].imageError =
      undefined;
    setSessions(newSessions);

    try {
      const uploadedUrl = await uploadSingleFile(imageUri);
      const updatedSessions = [...sessions];
      updatedSessions[sessionIndex].participants[participantIndex].image =
        uploadedUrl;
      updatedSessions[sessionIndex].participants[
        participantIndex
      ].imageUploading = false;
      setSessions(updatedSessions);
    } catch (error) {
      const errorSessions = [...sessions];
      errorSessions[sessionIndex].participants[
        participantIndex
      ].imageUploading = false;
      errorSessions[sessionIndex].participants[participantIndex].imageError =
        error instanceof Error ? error.message : "Failed to upload image";
      setSessions(errorSessions);
      console.error("Image upload error:", error);
    }
  };

  const pickImage = async (sessionIndex: number, participantIndex: number) => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need camera roll permissions to upload images"
      );
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      await uploadParticipantImage(sessionIndex, participantIndex, imageUri);
    }
  };
  useEffect(() => {
    if (categoriesError || countryError || stateError) {
      Alert.alert("Error", "Failed to fetch required data. Please try again.");
    }
  }, [categoriesError, countryError, stateError]);

  if (!userInfo) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <View className="bg-[#1A2432] p-8 rounded-full mb-6">
          <Plus size={60} color="#9EDD45" />
        </View>
        <Text className="text-white text-2xl font-bold text-center">
          Create an Event
        </Text>
        <Text className="text-gray-400 text-center mt-2 mb-8 text-lg">
          Join our community to start hosting your own amazing events!
        </Text>
        <TouchableOpacity
          className="bg-primary w-full py-4 rounded-xl items-center"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-background font-bold text-lg">Login / Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-6"
          onPress={() => router.replace("/(tabs)/home/home1")}
        >
          <Text className="text-primary font-medium text-base">Explore Events Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingData || editEventLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#9EDD45" />
        <Text className="text-white mt-4">Loading event data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.replace("/home/home1")}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">
          {eventId ? "Edit Event" : "Create Event"}
        </Text>
        {!eventId ? (
          <TouchableOpacity
            className="ml-auto bg-[#1A2432] border border-[#2E3A4D] px-3 py-2 rounded-full flex-row items-center"
            onPress={() => router.push("/create/ai")}
          >
            <Wand2 color="#9EDD45" size={16} />
            <Text className="text-primary font-semibold ml-2">AI draft</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ProgressSteps currentStep={0} />

      <ScrollView className="flex-1 px-4">
        <View className="space-y-6">
          {/* Event Details Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-lg font-bold text-white mb-4">
              Event Details
            </Text>

            {/* Event Title */}
            <View>
              <Text className="text-white my-2">
                Event Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                  !formData.title ? "border-red-500" : "border-transparent"
                }`}
                placeholder="Enter the name of your event*"
                placeholderTextColor="#6B7280"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
              />
            </View>

            {/* Event Category */}
            <View>
              <Text className="text-white my-2">
                Event Category <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center border ${
                  !formData.eventCategory
                    ? "border-red-500"
                    : "border-transparent"
                }`}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text
                  className={
                    formData.eventCategory ? "text-white" : "text-gray-400"
                  }
                >
                  {formData.eventCategory || "Please Select One*"}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Event Summary */}
            <View>
              <Text className="text-white my-2">
                Event Summary <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                  !formData.summary ? "border-red-500" : "border-transparent"
                }`}
                placeholder="Short summary for event cards and previews*"
                placeholderTextColor="#6B7280"
                value={formData.summary}
                onChangeText={(text) =>
                  setFormData({ ...formData, summary: text })
                }
              />
            </View>

            {/* Event Type */}
            <View>
              <Text className="text-white my-2">
                Event Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="space-y-2">
                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${
                    formData.event_type === "single"
                      ? "border border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() =>
                    setFormData({ ...formData, event_type: "single" })
                  }
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      formData.event_type === "single"
                        ? "border-primary"
                        : "border-gray-400"
                    } mr-3 items-center justify-center`}
                  >
                    {formData.event_type === "single" && (
                      <View className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text className="text-white">Single Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${
                    formData.event_type === "recurring"
                      ? "border border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() =>
                    setFormData({ ...formData, event_type: "recurring" })
                  }
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      formData.event_type === "recurring"
                        ? "border-primary"
                        : "border-gray-400"
                    } mr-3 items-center justify-center`}
                  >
                    {formData.event_type === "recurring" && (
                      <View className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text className="text-white">Recurring Event</Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.event_type === "recurring" && (
              <View>
                <Text className="text-white my-2">Recurring Frequency</Text>
                <View className="flex-row flex-wrap gap-2">
                  {RECURRING_FREQUENCIES.map((frequency) => (
                    <TouchableOpacity
                      key={frequency}
                      className={`px-3 py-2 rounded-lg ${
                        formData.recurring_frequency === frequency
                          ? "bg-primary"
                          : "bg-[#1A2432]"
                      }`}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          recurring_frequency: frequency,
                          sessionType: "multiple",
                        })
                      }
                    >
                      <Text
                        className={
                          formData.recurring_frequency === frequency
                            ? "text-background font-semibold"
                            : "text-white"
                        }
                      >
                        {frequency.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Attendance Mode */}
            <View>
              <Text className="text-white my-2">
                Attendance Mode <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row gap-2">
                {ATTENDANCE_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    className={`flex-1 rounded-lg py-3 items-center ${
                      formData.attendance_mode === mode
                        ? "bg-primary"
                        : "bg-[#1A2432]"
                    }`}
                    onPress={() => setFormData({ ...formData, attendance_mode: mode })}
                  >
                    <Text
                      className={
                        formData.attendance_mode === mode
                          ? "text-background font-semibold"
                          : "text-white"
                      }
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {needsOnline(formData.attendance_mode) && (
              <View className="bg-[#111823] p-3 rounded-lg mt-2">
                <Text className="text-white font-bold mb-3">Online Access</Text>
                <Text className="text-white my-2">
                  Platform <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {ONLINE_PLATFORMS.map((platform) => (
                    <TouchableOpacity
                      key={platform}
                      className={`px-3 py-2 rounded-lg ${
                        formData.online_platform === platform
                          ? "bg-primary"
                          : "bg-[#1A2432]"
                      }`}
                      onPress={() =>
                        setFormData({ ...formData, online_platform: platform })
                      }
                    >
                      <Text
                        className={
                          formData.online_platform === platform
                            ? "text-background font-semibold"
                            : "text-white"
                        }
                      >
                        {platform.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="text-white my-2">Online URL</Text>
                <TextInput
                  className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                  placeholder="https://..."
                  placeholderTextColor="#6B7280"
                  value={formData.online_url}
                  autoCapitalize="none"
                  onChangeText={(text) =>
                    setFormData({ ...formData, online_url: text })
                  }
                />

                <Text className="text-white my-2">
                  Access Instructions <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white h-24 border ${
                    !formData.online_access_instructions
                      ? "border-red-500"
                      : "border-transparent"
                  }`}
                  placeholder="Joining instructions, waiting room, passcode, or host notes*"
                  placeholderTextColor="#6B7280"
                  multiline
                  textAlignVertical="top"
                  value={formData.online_access_instructions}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      online_access_instructions: text,
                    })
                  }
                />

                <Text className="text-white my-2">
                  Timezone <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                    !formData.online_timezone
                      ? "border-red-500"
                      : "border-transparent"
                  }`}
                  placeholder="Africa/Lagos*"
                  placeholderTextColor="#6B7280"
                  value={formData.online_timezone}
                  autoCapitalize="none"
                  onChangeText={(text) =>
                    setFormData({ ...formData, online_timezone: text })
                  }
                />

                <Text className="text-white my-2">Reveal Link</Text>
                <View className="flex-row flex-wrap gap-2">
                  {ONLINE_REVEAL_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={`px-3 py-2 rounded-lg ${
                        formData.online_url_reveal === option
                          ? "bg-primary"
                          : "bg-[#1A2432]"
                      }`}
                      onPress={() =>
                        setFormData({ ...formData, online_url_reveal: option })
                      }
                    >
                      <Text
                        className={
                          formData.online_url_reveal === option
                            ? "text-background font-semibold"
                            : "text-white"
                        }
                      >
                        {option.replace(/_/g, " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Sessions Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <View>
              <Text className="text-white my-2">
                {`Session(S)`} <Text className="text-red-500">*</Text>
              </Text>
              <View className="space-y-2">
                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${
                    formData.sessionType === "single"
                      ? "border border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() => {
                    setFormData({ ...formData, sessionType: "single" });
                    setSessions([
                      {
                        name: "",
                        startDate: "",
                        endDate: "",
                        startTime: "",
                        endTime: "",
                        participants: [],
                      },
                    ]);
                  }}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      formData.sessionType === "single"
                        ? "border-primary"
                        : "border-gray-400"
                    } mr-3 items-center justify-center`}
                  >
                    {formData.sessionType === "single" && (
                      <View className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text className="text-white">Single Session</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${
                    formData.sessionType === "multiple"
                      ? "border border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() => {
                    setFormData({ ...formData, sessionType: "multiple" });
                    setSessions([
                      {
                        name: "",
                        startDate: "",
                        endDate: "",
                        startTime: "",
                        endTime: "",
                        participants: [],
                      },
                    ]);
                  }}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      formData.sessionType === "multiple"
                        ? "border-primary"
                        : "border-gray-400"
                    } mr-3 items-center justify-center`}
                  >
                    {formData.sessionType === "multiple" && (
                      <View className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text className="text-white">Multiple Session</Text>
                </TouchableOpacity>
              </View>
            </View>

            {sessions.map((session: any, sessionIndex: number) => (
              <View
                key={sessionIndex}
                className="space-y-4 border-b-2 border-cyan-600 mb-2 p-3"
              >
                {/* Session Header with Remove Button (only for multiple sessions) */}
                {formData.sessionType === "multiple" && (
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white font-bold text-lg">
                      Session {sessionIndex + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeSession(sessionIndex)}
                      className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500"
                    >
                      <Text className="text-red-500">Remove Session</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Session Name */}
                <View>
                  <Text className="text-white my-2">
                    Session name<Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                      !session.name ? "border-red-500" : "border-transparent"
                    }`}
                    placeholder="Enter the name of your this session*"
                    placeholderTextColor="#6B7280"
                    value={session.name}
                    onChangeText={(text) =>
                      updateSession(sessionIndex, "name", text)
                    }
                  />
                </View>

                {/* Start Date */}
                <View>
                  <Text className="text-white my-2">
                    Start Date<Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${
                      !session.startDate
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: "startDate" });
                      setShowDatePicker(true);
                    }}
                  >
                    <Text
                      className={
                        session.startDate ? "text-white" : "text-gray-400"
                      }
                    >
                      {session.startDate || "Select start date*"}
                    </Text>
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Start Time */}
                <View>
                  <Text className="text-white my-2">
                    Start Time <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${
                      !session.startTime
                        ? "border-red-500"
                        : "border-transparent"
                    }`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: "startTime" });
                      setShowTimePicker(true);
                    }}
                  >
                    <Text
                      className={
                        session.startTime ? "text-white" : "text-gray-400"
                      }
                    >
                      {session.startTime || "Select start time*"}
                    </Text>
                    <Clock size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                {/* Start Date */}
                <View>
                  <Text className="text-white my-2">
                    End Date<Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${
                      !session.endDate ? "border-red-500" : "border-transparent"
                    }`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: "endDate" });
                      setShowDatePicker(true);
                    }}
                  >
                    <Text
                      className={
                        session.endDate ? "text-white" : "text-gray-400"
                      }
                    >
                      {session.endDate || "Select end date*"}
                    </Text>
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                {/* End Time */}
                <View>
                  <Text className="text-white my-2">
                    End Time <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${
                      !session.endTime ? "border-red-500" : "border-transparent"
                    }`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: "endTime" });
                      setShowTimePicker(true);
                    }}
                  >
                    <Text
                      className={
                        session.endTime ? "text-white" : "text-gray-400"
                      }
                    >
                      {session.endTime || "Select end time*"}
                    </Text>
                    <Clock size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Participants Section */}
                <View className="mt-4">
                  <Text className="text-white text-lg font-bold mb-3">
                    Presenter/Host
                  </Text>

                  {session.participants.map(
                    (participant: any, participantIndex: number) => (
                      <View
                        key={participantIndex}
                        className="bg-[#1A2432] p-4 rounded-lg mb-4 border border-gray-700"
                      >
                        {/* Participant Header */}
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-white font-bold">
                            Participant {participantIndex + 1}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              removeParticipant(sessionIndex, participantIndex)
                            }
                            className="bg-red-500/20 px-2 py-1 rounded-lg border border-red-500"
                          >
                            <Text className="text-red-500 text-xs">Remove</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Participant Fields */}
                        <TextInput
                          className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
                          placeholder="Role (e.g., Keynote Speaker)"
                          placeholderTextColor="#6B7280"
                          value={participant.label}
                          onChangeText={(text) =>
                            updateParticipant(
                              sessionIndex,
                              participantIndex,
                              "label",
                              text
                            )
                          }
                        />

                        <TextInput
                          className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
                          placeholder="Presenter Name"
                          placeholderTextColor="#6B7280"
                          value={participant.name}
                          onChangeText={(text) =>
                            updateParticipant(
                              sessionIndex,
                              participantIndex,
                              "name",
                              text
                            )
                          }
                        />

                        <TextInput
                          className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
                          placeholder="Presentation Title"
                          placeholderTextColor="#6B7280"
                          value={participant.title}
                          onChangeText={(text) =>
                            updateParticipant(
                              sessionIndex,
                              participantIndex,
                              "title",
                              text
                            )
                          }
                        />

                        <TextInput
                          className="bg-[#111823] rounded-lg px-4 py-3 text-white h-20 mb-3"
                          placeholder="Description"
                          placeholderTextColor="#6B7280"
                          multiline
                          textAlignVertical="top"
                          value={participant.description}
                          onChangeText={(text) =>
                            updateParticipant(
                              sessionIndex,
                              participantIndex,
                              "description",
                              text
                            )
                          }
                        />

                        {/* Image Upload Section */}
                        <View className="mt-3">
                          <Text className="text-white mb-2">
                            Presenter Image
                          </Text>

                          {participant.image ? (
                            <View className="items-center">
                              <View className="relative">
                                <Image
                                  source={{ uri: participant.image }}
                                  className="w-24 h-24 rounded-full mb-2 border-2 border-primary"
                                />
                                {participant.imageUploading && (
                                  <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
                                    <ActivityIndicator color="#9EDD45" />
                                  </View>
                                )}
                              </View>
                              <TouchableOpacity
                                onPress={() =>
                                  pickImage(sessionIndex, participantIndex)
                                }
                                className="bg-primary/20 px-3 py-1 rounded-lg border border-primary"
                              >
                                <Text className="text-primary">
                                  Change Image
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() =>
                                pickImage(sessionIndex, participantIndex)
                              }
                              className="border-2 border-dashed border-gray-500 rounded-lg p-6 items-center justify-center bg-[#111823]"
                            >
                              {participant.imageUploading ? (
                                <View className="items-center">
                                  <ActivityIndicator color="#9EDD45" />
                                  <Text className="text-white text-xs mt-2">
                                    Uploading...
                                  </Text>
                                </View>
                              ) : (
                                <>
                                  <Text className="text-white">
                                    Tap to upload image
                                  </Text>
                                  <Text className="text-gray-400 text-xs mt-1">
                                    Recommended: 500x500px
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          {participant.imageError && (
                            <Text className="text-red-500 text-xs mt-1">
                              {participant.imageError}
                            </Text>
                          )}
                        </View>
                      </View>
                    )
                  )}

                  {/* Add Participant Button */}
                  <TouchableOpacity
                    onPress={() => addParticipant(sessionIndex)}
                    className="flex-row items-center justify-center bg-[#1A2432] p-3 rounded-lg border border-primary/50 mb-4"
                  >
                    <Text className="text-primary font-bold">
                      + Add Presenter
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {formData.sessionType === "multiple" && (
              <TouchableOpacity
                onPress={addSession}
                className="flex-row items-center my-2"
              >
                <Text className="text-primary text-end font-bold">
                  + Add Session
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Age Restrictions Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white mb-4 font-bold">Age Restrictions</Text>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowAgeRestrictionModal(true)}
            >
              <Text className="text-gray-400">
                {formData.age_restriction === 0
                  ? "All ages allowed"
                  : formData.guardian_required
                  ? `Age ${formData.age_restriction}+ (Guardian required)`
                  : `Age ${formData.age_restriction}+`}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Location Section */}
          {needsVenue(formData.attendance_mode) && (
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white mb-4 font-bold">Location</Text>
            <Text className="text-gray-500 my-2">
              Where will your event take place?
              <Text className="text-red-500">*</Text>
            </Text>

            <View className="flex-row items-center">
              <TouchableOpacity
                className={`bg-[#1A2432] w-full rounded-lg px-4 py-3 flex-row justify-between items-center border ${
                  !selectedCountry || !selectedState
                    ? "border-red-500"
                    : "border-transparent"
                }`}
                onPress={() => setShowCountryModal(true)}
              >
                <Text
                  className={
                    selectedCountry && selectedState
                      ? "text-white"
                      : "text-gray-400"
                  }
                >
                  {selectedCountry && selectedState
                    ? `${selectedState.name}, ${selectedCountry.name}`
                    : "Select Location*"}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* City */}
            <View>
              <Text className="text-white my-2">
                City <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                  !formData.city ? "border-red-500" : "border-transparent"
                }`}
                placeholder="Enter City*"
                placeholderTextColor="#6B7280"
                value={formData.city}
                onChangeText={(text) =>
                  setFormData({ ...formData, city: text })
                }
              />
            </View>

            {/* Address */}
            <View>
              <Text className="text-white my-2">
                Address <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${
                  !formData.address ? "border-red-500" : "border-transparent"
                }`}
                placeholder="Enter Street Address*"
                placeholderTextColor="#6B7280"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
              />
            </View>
          </View>
          )}

          {/* Event Description */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white my-2 font-bold">Event Description</Text>
            <Text className="text-gray-500 my-2">Additional Information</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white h-32"
              placeholder="Describe what's special about your event & other important details."
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
            />
          </View>

          {/* Event Enhancements */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white my-2 font-bold">Extra Event Details</Text>

            <Text className="text-white my-2">Tags</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
              placeholder="music, brunch, tech"
              placeholderTextColor="#6B7280"
              value={formData.tags}
              autoCapitalize="none"
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
            />

            <Text className="text-white my-2">Door Time</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
              placeholder="Doors open at 6:00 PM"
              placeholderTextColor="#6B7280"
              value={formData.door_time}
              onChangeText={(text) =>
                setFormData({ ...formData, door_time: text })
              }
            />

            <Text className="text-white my-2">Parking Info</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white h-20"
              placeholder="Parking, drop-off, accessibility, transit"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
              value={formData.parking_info}
              onChangeText={(text) =>
                setFormData({ ...formData, parking_info: text })
              }
            />

            <Text className="text-white my-2">Lineup / Extra Info</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white h-20"
              placeholder="Lineup, offers, discounts, or extra notes"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
              value={formData.discount_info}
              onChangeText={(text) =>
                setFormData({ ...formData, discount_info: text })
              }
            />

            <Text className="text-white my-2">Agenda</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white h-24"
              placeholder="Agenda, schedule, set times, or event flow"
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
              value={formData.agenda_info}
              onChangeText={(text) =>
                setFormData({ ...formData, agenda_info: text })
              }
            />
          </View>

          {/* FAQs */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white font-bold">FAQs</Text>
              <TouchableOpacity
                className="bg-primary/20 border border-primary rounded-lg px-3 py-2"
                onPress={addFaq}
              >
                <Text className="text-primary font-semibold">+ Add FAQ</Text>
              </TouchableOpacity>
            </View>

            {(formData.faqs || []).map((faq: any, index: number) => (
              <View
                key={index}
                className="bg-[#1A2432] rounded-lg p-3 mb-3 border border-gray-700"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-semibold">
                    FAQ {index + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeFaq(index)}>
                    <Text className="text-red-400">Remove</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-2"
                  placeholder="Question"
                  placeholderTextColor="#6B7280"
                  value={faq.question}
                  onChangeText={(text) => updateFaq(index, "question", text)}
                />
                <TextInput
                  className="bg-[#111823] rounded-lg px-4 py-3 text-white h-20"
                  placeholder="Answer"
                  placeholderTextColor="#6B7280"
                  multiline
                  textAlignVertical="top"
                  value={faq.answer}
                  onChangeText={(text) => updateFaq(index, "answer", text)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save and Continue Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`rounded-lg py-4 ${
            isFormValid ? "bg-primary" : "bg-gray-500"
          }`}
          onPress={handleSaveAndContinue}
          disabled={!isFormValid}
        >
          <Text className="text-background text-center font-semibold">
            Save and continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setShowTimePicker(false)}
      />

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Select Category
            </Text>
            {categoriesLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {categories.map((category: any) => (
                  <TouchableOpacity
                    key={category.id}
                    className="py-4 border-b border-gray-700"
                    onPress={() => {
                      setFormData({
                        ...formData,
                        eventCategory: category?.name,
                        category_id: category?.id,
                      });
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text className="text-white">{category?.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal visible={showCountryModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowCountryModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Select Country
            </Text>
            {countryLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {countries.map((country: any) => (
                  <TouchableOpacity
                    key={country.code2}
                    className="py-4 border-b border-gray-700"
                    onPress={() => {
                      setSelectedCountry(country);
                      setSelectedState(null);
                      setFormData({
                        ...formData,
                        country_code: country.code2,
                        state_id: "",
                      });
                      setShowCountryModal(false);
                      setShowStateModal(true);
                    }}
                  >
                    <Text className="text-white">{country.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* State Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowStateModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Select State
            </Text>
            {stateLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {states.map((state: any) => (
                  <TouchableOpacity
                    key={state.id}
                    className="py-4 border-b border-gray-700"
                    onPress={() => {
                      setFormData({ ...formData, state_id: state.id });
                      setSelectedState(state);
                      setShowStateModal(false);
                    }}
                  >
                    <Text className="text-white">{state.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Age Restriction Modal */}
      <Modal
        visible={showAgeRestrictionModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowAgeRestrictionModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Age Restrictions
            </Text>
            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  age_restriction: 0,
                  guardian_required: false,
                });
                setShowAgeRestrictionModal(false);
              }}
            >
              <Text className="text-white">All ages allowed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  age_restriction:
                    formData.age_restriction > 0
                      ? formData.age_restriction
                      : 18,
                  guardian_required: false,
                });
              }}
            >
              <Text className="text-white">There&apos;s an age restriction</Text>
            </TouchableOpacity>

            {/* Age selection options */}
            {formData.age_restriction > 0 && (
              <ScrollView className="max-h-64 ml-4">
                {Array.from({ length: 52 }, (_, i) => i).map((age) => (
                  <TouchableOpacity
                    key={age}
                    className="py-3 border-b border-gray-700"
                    onPress={() => {
                      setFormData({
                        ...formData,
                        age_restriction: age,
                      });
                    }}
                  >
                    <Text
                      className={`text-white ${
                        formData.age_restriction === age
                          ? "font-bold text-primary"
                          : ""
                      }`}
                    >
                      {age === 0 ? "All ages" : `Age ${age}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Guardian required option */}
            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  guardian_required: !formData.guardian_required,
                  age_restriction:
                    formData.age_restriction > 0
                      ? formData.age_restriction
                      : 18,
                });
              }}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-5 h-5 rounded-full border-2 ${
                    formData.guardian_required
                      ? "border-primary"
                      : "border-gray-400"
                  } mr-3 items-center justify-center`}
                >
                  {formData.guardian_required && (
                    <View className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </View>
                <Text className="text-white">Parent or guardian needed</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 mt-4"
              onPress={() => setShowAgeRestrictionModal(false)}
            >
              <Text className="text-background text-center font-semibold">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
