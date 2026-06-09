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
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useRouter } from "expo-router";
import { Calendar, ChevronDown, Sparkles, Wand2 } from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import {
  useGenerateAiEventDraftMutation,
  useGetAiEventBuilderStatusQuery,
} from "@/redux/api/newEventsApiSlice";
import {
  useGetcategoriesQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
} from "@/redux/api/eventsApiSlice";
import { useSelector } from "react-redux";
import type { AiEventBuilderRequest } from "@/types/aiEventBuilder";
import { getApiErrorMessage } from "@/utils/api";
import {
  AI_EVENT_DRAFT_STORAGE_KEY,
  ATTENDANCE_MODES,
  DEFAULT_TIMEZONE,
  ONLINE_PLATFORMS,
} from "@/utils/newEventForm";

const GOALS = [
  "Sell tickets",
  "Build community",
  "Teach a topic",
  "Promote a service",
  "Capture feedback",
];

const TONES = [
  "Premium and clear",
  "Faith-centered and practical",
  "Professional",
  "Family-friendly",
  "Energetic",
  "Custom",
];

const AGE_RULES = ["All ages", "13+", "16+", "18+", "Guardian required"];
const TICKET_PLANS = ["Free tickets", "Paid event", "Donation optional", "VIP tiers"];

const initialBrief = {
  prompt: "",
  audience: "",
  attendanceMode: "VENUE",
  city: "",
  stateId: "",
  state: "",
  country: "NG",
  dateHint: "",
  startTime: "6:00 PM",
  endTime: "8:00 PM",
  expectedGuests: "100",
  ticketPlan: "Free tickets",
  ticketName: "General admission",
  currency: "NGN",
  currencyLabel: "NGN - Nigeria",
  basePrice: "",
  ageRule: "All ages",
  tone: "Premium and clear",
  customTone: "",
  tags: "",
  goals: ["Sell tickets"],
  onlinePlatform: "ZOOM",
  onlineTimezone: DEFAULT_TIMEZONE,
  onlineAccessInstructions: "",
};

type BriefState = typeof initialBrief;

export default function AiCreateScreen() {
  const router = useRouter();
  const { userInfo } = useSelector((state: any) => state.auth);
  const [brief, setBrief] = useState<BriefState>(initialBrief);
  const [pickerMode, setPickerMode] = useState<"date" | "start" | "end" | null>(null);
  const [modal, setModal] = useState<"category" | "country" | "state" | "tone" | "age" | "ticket" | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { data, isLoading, isFetching } = useGetAiEventBuilderStatusQuery();
  const [generateDraft, { isLoading: isGenerating }] = useGenerateAiEventDraftMutation();
  const { data: categoriesData } = useGetcategoriesQuery({});
  const { data: countriesData } = useGetCountriesQuery({});
  const { data: statesData } = useGetStatesQuery(brief.country, { skip: !brief.country });

  const status = data?.body;
  const categories = useMemo(() => categoriesData?.body || [], [categoriesData?.body]);
  const countries = useMemo(() => countriesData?.body || [], [countriesData?.body]);
  const states = useMemo(() => statesData?.body || [], [statesData?.body]);
  const needsOnline =
    brief.attendanceMode === "ONLINE" || brief.attendanceMode === "HYBRID";
  const needsVenue =
    brief.attendanceMode === "VENUE" || brief.attendanceMode === "HYBRID";

  const selectedCountryName = useMemo(() => {
    const match = countries.find((country: any) => country.code2 === brief.country);
    return match?.name || brief.country;
  }, [brief.country, countries]);

  const updateBrief = (patch: Partial<BriefState>) =>
    setBrief((current) => ({ ...current, ...patch }));

  const toggleGoal = (goal: string) => {
    setBrief((current) => {
      const hasGoal = current.goals.includes(goal);
      const nextGoals = hasGoal
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal];
      return { ...current, goals: nextGoals.length ? nextGoals : [goal] };
    });
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const handlePickerConfirm = (date: Date) => {
    if (pickerMode === "date") updateBrief({ dateHint: formatDate(date) });
    if (pickerMode === "start") updateBrief({ startTime: formatTime(date) });
    if (pickerMode === "end") updateBrief({ endTime: formatTime(date) });
    setPickerMode(null);
  };

  const buildRequest = (): AiEventBuilderRequest => ({
    prompt: brief.prompt,
    audience: brief.audience,
    attendanceMode: brief.attendanceMode,
    city: brief.city,
    state: brief.state,
    stateId: brief.stateId,
    country: brief.country,
    dateHint: brief.dateHint,
    startTime: brief.startTime,
    endTime: brief.endTime,
    expectedGuests: Number(brief.expectedGuests || 0) || 100,
    ticketPlan: brief.ticketPlan,
    ticketName: brief.ticketName,
    currency: brief.currency,
    currencyLabel: brief.currencyLabel,
    basePrice: brief.basePrice,
    ageRule: brief.ageRule,
    tone: brief.tone === "Custom" ? brief.customTone || "Clear and polished" : brief.tone,
    tags: brief.tags,
    goals: brief.goals,
    onlinePlatform: needsOnline ? brief.onlinePlatform : undefined,
    onlineTimezone: needsOnline ? brief.onlineTimezone : undefined,
    onlineAccessInstructions: needsOnline ? brief.onlineAccessInstructions : undefined,
    categoryId,
  });

  const handleGenerate = async () => {
    if (!userInfo) {
      Alert.alert(
        "Sign in required",
        "Please sign in before generating. Your brief stays on this screen."
      );
      router.push("/(auth)/login");
      return;
    }

    if (!status?.ready) {
      Alert.alert("AI builder unavailable", status?.comingSoonMessage || "Try the manual builder for now.");
      return;
    }

    if (!brief.prompt.trim()) {
      Alert.alert("Add an event idea", "Tell AI what you want to create first.");
      return;
    }

    if (needsVenue && !brief.country) {
      Alert.alert("Choose a country", "Venue and hybrid events need a country.");
      return;
    }

    try {
      const request = buildRequest();
      const response = await generateDraft(request).unwrap();
      await AsyncStorage.setItem(
        AI_EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify({ draft: response.body, request })
      );
      router.push("/create/ai/review");
    } catch (error) {
      Alert.alert("AI generation failed", getApiErrorMessage(error, "Please try again."));
    }
  };

  const renderOptionModal = () => {
    let title = "";
    let options: { label: string; value: string; meta?: any }[] = [];
    let onSelect = (_option: { label: string; value: string; meta?: any }) => {};

    if (modal === "category") {
      title = "Event category";
      options = categories.map((category: any) => ({
        label: category.name,
        value: String(category.id),
      }));
      onSelect = (option) => {
        setCategoryName(option.label);
        setCategoryId(option.value);
        setModal(null);
      };
    }

    if (modal === "country") {
      title = "Country";
      options = countries.map((country: any) => ({
        label: country.name,
        value: country.code2,
        meta: country,
      }));
      onSelect = (option) => {
        updateBrief({
          country: option.value,
          state: "",
          stateId: "",
          currency: option.meta?.currency_code || brief.currency,
          currencyLabel: option.meta?.currency
            ? `${option.meta.currency_code || ""} - ${option.meta.currency}`.trim()
            : brief.currencyLabel,
        });
        setModal(null);
      };
    }

    if (modal === "state") {
      title = "State";
      options = states.map((state: any) => ({
        label: state.name,
        value: String(state.id),
      }));
      onSelect = (option) => {
        updateBrief({ state: option.label, stateId: option.value });
        setModal(null);
      };
    }

    if (modal === "tone") {
      title = "Tone";
      options = TONES.map((tone) => ({ label: tone, value: tone }));
      onSelect = (option) => {
        updateBrief({ tone: option.value });
        setModal(null);
      };
    }

    if (modal === "age") {
      title = "Age rule";
      options = AGE_RULES.map((rule) => ({ label: rule, value: rule }));
      onSelect = (option) => {
        updateBrief({ ageRule: option.value });
        setModal(null);
      };
    }

    if (modal === "ticket") {
      title = "Ticket plan";
      options = TICKET_PLANS.map((plan) => ({ label: plan, value: plan }));
      onSelect = (option) => {
        updateBrief({ ticketPlan: option.value });
        setModal(null);
      };
    }

    return (
      <Modal visible={Boolean(modal)} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#111823] rounded-t-3xl p-5 max-h-[70%]">
            <Text className="text-white text-xl font-semibold mb-4">{title}</Text>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={`${option.value}-${option.label}`}
                  className="bg-[#1A2432] rounded-xl px-4 py-4 mb-3"
                  onPress={() => onSelect(option)}
                >
                  <Text className="text-white font-medium">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="border border-[#2E3A4D] rounded-xl py-4 mt-2"
              onPress={() => setModal(null)}
            >
              <Text className="text-gray-300 text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ProfileFoundationScreen
      isLoading={isLoading || isFetching}
      title="Create with AI"
      subtitle="Build a complete event draft before editing"
      stats={[
        { label: "AI ready", value: status?.ready ? "Yes" : "No" },
        { label: "Model", value: status?.model || "Not set" },
        { label: "Mode", value: "Draft first" },
      ]}
    >
      {!status?.ready ? (
        <View className="bg-[#1A2432] rounded-2xl p-5 mb-5 border border-[#2E3A4D]">
          <View className="flex-row items-center">
            <Wand2 color="#9EDD45" size={22} />
            <Text className="text-white text-lg font-semibold ml-2">Coming soon</Text>
          </View>
          <Text className="text-gray-400 mt-2">
            {status?.comingSoonMessage || "The AI event builder is not enabled yet."}
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-xl px-4 py-4 mt-4"
            onPress={() => router.push("/create")}
          >
            <Text className="text-background text-center font-semibold">Use manual builder</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="bg-[#111823] rounded-2xl p-4 border border-[#243044]">
        <View className="flex-row items-center mb-4">
          <View className="w-11 h-11 rounded-xl bg-[#6C4DFF]/20 items-center justify-center">
            <Sparkles color="#8B6BFF" size={22} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white text-xl font-semibold">Describe the event</Text>
            <Text className="text-gray-400">AI will draft details, tickets, FAQs, and automation ideas.</Text>
          </View>
        </View>

        <Text className="text-white mb-2 font-medium">Event idea</Text>
        <TextInput
          className="bg-[#1A2432] rounded-xl px-4 py-4 text-white min-h-[130px] border border-[#2E3A4D]"
          multiline
          textAlignVertical="top"
          placeholder="Example: A faith and leadership workshop for young professionals in Nashville..."
          placeholderTextColor="#728097"
          value={brief.prompt}
          onChangeText={(prompt) => updateBrief({ prompt })}
        />

        <View className="mt-5">
          <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
            AUDIENCE AND STYLE
          </Text>
          <TextInput
            className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D] mb-3"
            placeholder="Audience, e.g. families, founders, church leaders"
            placeholderTextColor="#728097"
            value={brief.audience}
            onChangeText={(audience) => updateBrief({ audience })}
          />
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between"
            onPress={() => setModal("tone")}
          >
            <Text className="text-white">{brief.tone}</Text>
            <ChevronDown color="#728097" size={18} />
          </TouchableOpacity>
          {brief.tone === "Custom" ? (
            <TextInput
              className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D] mt-3"
              placeholder="Describe the tone you want"
              placeholderTextColor="#728097"
              value={brief.customTone}
              onChangeText={(customTone) => updateBrief({ customTone })}
            />
          ) : null}
        </View>

        <View className="mt-5">
          <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
            FORMAT AND TIMING
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {ATTENDANCE_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                className={`px-4 py-3 rounded-xl border ${
                  brief.attendanceMode === mode
                    ? "bg-primary border-primary"
                    : "bg-[#1A2432] border-[#2E3A4D]"
                }`}
                onPress={() => updateBrief({ attendanceMode: mode })}
              >
                <Text className={brief.attendanceMode === mode ? "text-background font-semibold" : "text-white"}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between mb-3"
            onPress={() => setPickerMode("date")}
          >
            <Text className={brief.dateHint ? "text-white" : "text-gray-400"}>
              {brief.dateHint || "Preferred date"}
            </Text>
            <Calendar color="#728097" size={18} />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D]"
              onPress={() => setPickerMode("start")}
            >
              <Text className="text-gray-400 text-xs">Start</Text>
              <Text className="text-white mt-1">{brief.startTime}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D]"
              onPress={() => setPickerMode("end")}
            >
              <Text className="text-gray-400 text-xs">End</Text>
              <Text className="text-white mt-1">{brief.endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {needsVenue ? (
          <View className="mt-5">
            <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
              LOCATION
            </Text>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between mb-3"
              onPress={() => setModal("country")}
            >
              <Text className="text-white">{selectedCountryName}</Text>
              <ChevronDown color="#728097" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between mb-3"
              onPress={() => setModal("state")}
            >
              <Text className={brief.state ? "text-white" : "text-gray-400"}>
                {brief.state || "State"}
              </Text>
              <ChevronDown color="#728097" size={18} />
            </TouchableOpacity>
            <TextInput
              className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D]"
              placeholder="City"
              placeholderTextColor="#728097"
              value={brief.city}
              onChangeText={(city) => updateBrief({ city })}
            />
          </View>
        ) : null}

        {needsOnline ? (
          <View className="mt-5">
            <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
              ONLINE ACCESS
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {ONLINE_PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform}
                  className={`px-3 py-2 rounded-xl border ${
                    brief.onlinePlatform === platform
                      ? "bg-primary border-primary"
                      : "bg-[#1A2432] border-[#2E3A4D]"
                  }`}
                  onPress={() => updateBrief({ onlinePlatform: platform })}
                >
                  <Text className={brief.onlinePlatform === platform ? "text-background font-semibold" : "text-white"}>
                    {platform.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D]"
              placeholder="Online access instructions"
              placeholderTextColor="#728097"
              value={brief.onlineAccessInstructions}
              onChangeText={(onlineAccessInstructions) => updateBrief({ onlineAccessInstructions })}
            />
          </View>
        ) : null}

        <View className="mt-5">
          <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
            TICKETS AND RULES
          </Text>
          <TextInput
            className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D] mb-3"
            placeholder="Expected guests"
            placeholderTextColor="#728097"
            keyboardType="number-pad"
            value={brief.expectedGuests}
            onChangeText={(expectedGuests) => updateBrief({ expectedGuests })}
          />
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between mb-3"
            onPress={() => setModal("ticket")}
          >
            <Text className="text-white">{brief.ticketPlan}</Text>
            <ChevronDown color="#728097" size={18} />
          </TouchableOpacity>
          <TextInput
            className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D] mb-3"
            placeholder="Ticket name"
            placeholderTextColor="#728097"
            value={brief.ticketName}
            onChangeText={(ticketName) => updateBrief({ ticketName })}
          />
          {brief.ticketPlan !== "Free tickets" ? (
            <View className="flex-row gap-3 mb-3">
              <TextInput
                className="flex-1 bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D]"
                placeholder="Currency"
                placeholderTextColor="#728097"
                value={brief.currency}
                onChangeText={(currency) => updateBrief({ currency, currencyLabel: currency })}
              />
              <TextInput
                className="flex-1 bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D]"
                placeholder="Base price"
                placeholderTextColor="#728097"
                keyboardType="decimal-pad"
                value={brief.basePrice}
                onChangeText={(basePrice) => updateBrief({ basePrice })}
              />
            </View>
          ) : null}
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between"
            onPress={() => setModal("age")}
          >
            <Text className="text-white">{brief.ageRule}</Text>
            <ChevronDown color="#728097" size={18} />
          </TouchableOpacity>
        </View>

        <View className="mt-5">
          <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-3">
            POSITIONING
          </Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 border border-[#2E3A4D] flex-row justify-between mb-3"
            onPress={() => setModal("category")}
          >
            <Text className={categoryName ? "text-white" : "text-gray-400"}>
              {categoryName || "Optional category"}
            </Text>
            <ChevronDown color="#728097" size={18} />
          </TouchableOpacity>
          <TextInput
            className="bg-[#1A2432] rounded-xl px-4 py-3 text-white border border-[#2E3A4D] mb-3"
            placeholder="Tags, comma separated"
            placeholderTextColor="#728097"
            value={brief.tags}
            onChangeText={(tags) => updateBrief({ tags })}
          />
          <View className="flex-row flex-wrap gap-2">
            {GOALS.map((goal) => {
              const selected = brief.goals.includes(goal);
              return (
                <TouchableOpacity
                  key={goal}
                  className={`px-3 py-2 rounded-xl border ${
                    selected ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
                  }`}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text className={selected ? "text-background font-semibold" : "text-white"}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 mt-6 flex-row items-center justify-center ${
            isGenerating || !status?.ready ? "bg-[#5E6A7D]" : "bg-primary"
          }`}
          disabled={isGenerating || !status?.ready}
          onPress={handleGenerate}
        >
          {isGenerating ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Wand2 color="#020617" size={18} />
          )}
          <Text className="text-background font-bold ml-2">
            {isGenerating ? "Generating draft..." : "Generate full event"}
          </Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={Boolean(pickerMode)}
        mode={pickerMode === "date" ? "date" : "time"}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerMode(null)}
      />
      {renderOptionModal()}
    </ProfileFoundationScreen>
  );
}
