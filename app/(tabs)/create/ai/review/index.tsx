import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Edit3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
} from "lucide-react-native";
import ProfileFoundationScreen from "@/app/components/profile/ProfileFoundationScreen";
import { useSuggestAiEventEditsMutation } from "@/redux/api/newEventsApiSlice";
import type {
  AiAutomationRule,
  AiEventBuilderRequest,
  AiEventDraft,
  AiEditSuggestion,
} from "@/types/aiEventBuilder";
import { getApiErrorMessage } from "@/utils/api";
import {
  AI_EVENT_DRAFT_STORAGE_KEY,
  AI_EVENT_IMPORT_STORAGE_KEY,
  mapAiDraftToMobileForm,
} from "@/utils/newEventForm";

type StoredDraft = {
  draft: AiEventDraft;
  request?: AiEventBuilderRequest;
};

const textFrom = (value: unknown, fallback = "") => {
  if (Array.isArray(value)) return value.map((item) => textFrom(item)).filter(Boolean).join(", ");
  if (value && typeof value === "object") return "";
  return String(value || fallback).trim();
};

const arrayField = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => textFrom(item)).filter(Boolean);
};

export default function AiReviewScreen() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focus, setFocus] = useState("");
  const [suggestDraft, { isLoading: isImproving }] = useSuggestAiEventEditsMutation();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(AI_EVENT_DRAFT_STORAGE_KEY);
        if (!raw) {
          setStored(null);
          return;
        }
        setStored(JSON.parse(raw));
      } catch (error) {
        console.error("Failed to load AI draft", error);
        setStored(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, []);

  const draft = stored?.draft;
  const request = stored?.request;
  const mappedForm = useMemo(
    () => (draft ? mapAiDraftToMobileForm(draft, request) : null),
    [draft, request]
  );

  const title = mappedForm?.title || "AI event draft";
  const summary = mappedForm?.summary || "Review the generated event plan before editing.";
  const sessions = mappedForm?.sessions || [];
  const tickets = mappedForm?.tickets || [];
  const automations = draft?.automationRules || [];
  const quality = draft?.quality;
  const suggestions = draft?.editSuggestions || [];
  const tags = mappedForm?.tags
    ? mappedForm.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
    : [];

  const handleImprove = async () => {
    if (!draft) return;

    try {
      const response = await suggestDraft({ draft, focus }).unwrap();
      const rewrittenFields = response.body?.rewrittenFields || {};
      const nextDraft: AiEventDraft = {
        ...draft,
        details: { ...draft.details, ...rewrittenFields },
        quality: { ...draft.quality, ...(response.body?.quality || {}) },
        editSuggestions: response.body?.editSuggestions || draft.editSuggestions,
      };
      const nextStored = { ...stored, draft: nextDraft } as StoredDraft;
      setStored(nextStored);
      await AsyncStorage.setItem(AI_EVENT_DRAFT_STORAGE_KEY, JSON.stringify(nextStored));
      setFocus("");
    } catch (error) {
      Alert.alert("Improve failed", getApiErrorMessage(error, "Please try again."));
    }
  };

  const handleImport = async () => {
    if (!mappedForm) return;

    await AsyncStorage.setItem(AI_EVENT_IMPORT_STORAGE_KEY, JSON.stringify(mappedForm));
    router.replace({ pathname: "/create", params: { source: "ai" } });
  };

  if (isLoading) {
    return (
      <ProfileFoundationScreen title="Building your event" subtitle="AI event automation">
        <View className="bg-[#111823] rounded-2xl border border-[#243044] p-6 items-center">
          <ActivityIndicator color="#9EDD45" />
          <Text className="text-white mt-4 text-lg font-semibold">Loading AI draft</Text>
          <Text className="text-gray-400 text-center mt-2">
            Preparing the generated structure for review.
          </Text>
        </View>
      </ProfileFoundationScreen>
    );
  }

  if (!draft || !mappedForm) {
    return (
      <ProfileFoundationScreen title="Review AI draft" subtitle="AI event automation">
        <View className="bg-[#111823] rounded-2xl border border-[#243044] p-6">
          <Text className="text-white text-lg font-semibold">No draft found</Text>
          <Text className="text-gray-400 mt-2">
            Generate a fresh AI event draft before reviewing.
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 mt-5"
            onPress={() => router.replace("/create/ai")}
          >
            <Text className="text-background text-center font-bold">Create a brief</Text>
          </TouchableOpacity>
        </View>
      </ProfileFoundationScreen>
    );
  }

  return (
    <ProfileFoundationScreen title="Review AI draft" subtitle="AI event automation">
      <View className="bg-[#111823] rounded-2xl border border-[#243044] p-4 mb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-white text-2xl font-semibold">{title}</Text>
            <Text className="text-gray-300 mt-2 leading-6">{summary}</Text>
          </View>
          <View className="bg-[#6C4DFF]/15 rounded-full px-3 py-2">
            <Text className="text-[#A993FF] font-semibold text-xs">
              {quality?.score ? `${quality.score}%` : "Draft"}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3 mt-5">
          <Metric icon={<Calendar color="#7C5CFF" size={18} />} value={sessions.length} label="Sessions" />
          <Metric icon={<Ticket color="#7C5CFF" size={18} />} value={tickets.length} label="Tickets" />
          <Metric icon={<Sparkles color="#7C5CFF" size={18} />} value={automations.length} label="Automations" />
        </View>
      </View>

      <View className="bg-[#111823] rounded-2xl border border-[#243044] p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <Edit3 color="#7C5CFF" size={19} />
          <Text className="text-white text-xl font-semibold ml-2">Generated event plan</Text>
        </View>
        <Text className="text-gray-400 mb-4">
          This is what AI prepared. You can improve it here, then continue editing.
        </Text>

        <PlanRow
          icon={<Calendar color="#7C5CFF" size={18} />}
          label="Schedule"
          value={
            sessions[0]
              ? `${sessions[0].name} · ${sessions[0].startDate || "Date needed"} · ${sessions[0].startTime || "Start"} - ${sessions[0].endTime || "End"}`
              : "No session generated"
          }
        />
        <PlanRow
          icon={<MapPin color="#7C5CFF" size={18} />}
          label="Location"
          value={
            mappedForm.attendance_mode === "ONLINE"
              ? `Online · ${mappedForm.online_platform}`
              : `${mappedForm.city || "City needed"} · ${mappedForm.country_code || "Country needed"}`
          }
        />
        <PlanRow
          icon={<Ticket color="#7C5CFF" size={18} />}
          label="Tickets"
          value={tickets.map((ticket: any) => `${ticket.name} · ${mappedForm.is_free ? "Free" : `${mappedForm.currency || ""} ${ticket.price || 0}`}`).join("\n")}
        />
        <PlanRow
          icon={<Tag color="#7C5CFF" size={18} />}
          label="Tags"
          value={tags.length ? tags.map((tag) => `#${tag}`).join("  ") : "Tags will be added in the builder"}
        />

        <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mt-3">
          <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-2">
            ATTENDEE DESCRIPTION
          </Text>
          <Text className="text-gray-200 leading-6">{mappedForm.description}</Text>
        </View>

        {mappedForm.faqs?.length ? (
          <View className="mt-3">
            <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-2">FAQS</Text>
            {mappedForm.faqs.slice(0, 3).map((faq: any, index: number) => (
              <View key={`${faq.question}-${index}`} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-2">
                <Text className="text-white font-medium">{faq.question}</Text>
                <Text className="text-gray-400 mt-1">{faq.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View className="bg-[#111823] rounded-2xl border border-[#243044] p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <ShieldCheck color="#7C5CFF" size={19} />
          <Text className="text-white text-xl font-semibold ml-2">Quality controls</Text>
        </View>

        <QualityBlock title="Strengths" items={quality?.strengths || []} />
        <QualityBlock title="Needs attention" items={quality?.missing || []} />
        <QualityBlock title="Warnings" items={quality?.warnings || []} />

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mt-4 flex-row items-center justify-center"
          onPress={handleImport}
        >
          <Text className="text-background font-bold mr-2">Continue editing</Text>
          <ArrowRight color="#020617" size={18} />
        </TouchableOpacity>
      </View>

      <View className="bg-[#111823] rounded-2xl border border-[#243044] p-4 mb-4">
        <Text className="text-white text-xl font-semibold">Automation rules</Text>
        <Text className="text-gray-400 mt-1 mb-3">Ideas to review after the event is imported.</Text>
        {automations.length ? (
          automations.map((rule: AiAutomationRule) => (
            <View key={rule.id || rule.name} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
              <View className="flex-row justify-between">
                <Text className="text-white font-semibold flex-1 pr-2">{rule.name}</Text>
                <CheckCircle2 color="#9EDD45" size={18} />
              </View>
              <Text className="text-gray-400 mt-1">{rule.timing} · {rule.channel}</Text>
              <Text className="text-gray-300 mt-3">Trigger: {rule.trigger}</Text>
              <Text className="text-gray-300 mt-1">Action: {rule.action}</Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-400">No automation rules generated yet.</Text>
        )}
      </View>

      <View className="bg-[#111823] rounded-2xl border border-[#243044] p-4">
        <Text className="text-white text-xl font-semibold">Improve before editing</Text>
        <Text className="text-gray-400 mt-1">
          Ask AI to tighten the draft before sending it into the builder.
        </Text>
        <View className="flex-row items-center mt-4 bg-[#1A2432] border border-[#2E3A4D] rounded-xl">
          <TextInput
            className="flex-1 px-4 py-3 text-white"
            placeholder="Example: make it warmer and add clearer ticket details"
            placeholderTextColor="#728097"
            value={focus}
            onChangeText={setFocus}
          />
          <TouchableOpacity
            className="bg-[#0B1020] rounded-xl px-4 py-3 mr-1 flex-row items-center"
            disabled={isImproving}
            onPress={handleImprove}
          >
            {isImproving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <RefreshCw color="#FFFFFF" size={16} />
            )}
            <Text className="text-white font-semibold ml-2">Improve</Text>
          </TouchableOpacity>
        </View>

        {suggestions.length ? (
          <View className="mt-4">
            {suggestions.map((suggestion: AiEditSuggestion, index) => (
              <View key={`${suggestion.area}-${index}`} className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-2">
                <Text className="text-white font-semibold">{suggestion.area}</Text>
                <Text className="text-gray-400 mt-1">{suggestion.suggestion}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ProfileFoundationScreen>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <View className="flex-1 bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-3">
      {icon}
      <Text className="text-white text-2xl font-semibold mt-3">{value}</Text>
      <Text className="text-gray-400 text-xs mt-1">{label}</Text>
    </View>
  );
}

function PlanRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl p-4 mb-3">
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold ml-2">{label.toUpperCase()}</Text>
      </View>
      <Text className="text-gray-200 leading-6">{value}</Text>
    </View>
  );
}

function QualityBlock({ title, items }: { title: string; items: string[] }) {
  const cleanItems = arrayField(items);
  return (
    <View className="mb-3">
      <Text className="text-[#8B6BFF] tracking-[4px] text-xs font-bold mb-2">
        {title.toUpperCase()}
      </Text>
      {cleanItems.length ? (
        cleanItems.map((item) => (
          <View key={item} className="flex-row items-center mb-2">
            <CheckCircle2 color="#9EDD45" size={16} />
            <Text className="text-gray-200 ml-2 flex-1">{item}</Text>
          </View>
        ))
      ) : (
        <Text className="text-gray-500">Nothing flagged.</Text>
      )}
    </View>
  );
}
