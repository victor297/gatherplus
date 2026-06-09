import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  RefreshCcw,
  Send,
} from "lucide-react-native";
import {
  useGetEventQuestionnaireQuery,
  useSubmitQuestionnaireAnswersMutation,
} from "@/redux/api/questionnaireApiSlice";
import type { AttendeeQuestionnaireQuestion } from "@/types/questionnaire";
import { getStringParam } from "@/utils/routeParams";
import { formatDate } from "@/utils/formatDate";

type AnswerMap = Record<string, unknown>;

const TEXT_TYPES = new Set(["TEXT", "SHORT_TEXT", "EMAIL", "PHONE", "URL"]);
const LONG_TEXT_TYPES = new Set(["TEXTAREA", "LONG_TEXT", "PARAGRAPH"]);
const OPTION_TYPES = new Set(["SELECT", "RADIO", "DROPDOWN"]);
const MULTI_TYPES = new Set(["CHECKBOX", "MULTISELECT", "MULTI_SELECT"]);
const RATING_TYPES = new Set(["RATING", "SCALE"]);

const normalizeType = (type?: string) => String(type || "TEXT").trim().toUpperCase();

const stringifyAnswer = (value: unknown) => {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  return String(value ?? "");
};

const answerIsEmpty = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || String(value).trim() === "";
};

const normalizeOptions = (question: AttendeeQuestionnaireQuestion) => {
  const raw =
    question.options ??
    question.settings?.options ??
    question.validation?.options ??
    question.settings?.choices ??
    question.validation?.choices;

  const parseValue = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") return String(item);
          if (item && typeof item === "object") {
            const option = item as Record<string, unknown>;
            return String(option.label || option.value || option.name || "");
          }
          return "";
        })
        .filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        return parseValue(JSON.parse(trimmed));
      } catch {
        return trimmed
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  return parseValue(raw);
};

const sectionsFromQuestions = (questions: AttendeeQuestionnaireQuestion[]) => {
  const grouped = new Map<string, AttendeeQuestionnaireQuestion[]>();
  questions
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .forEach((question) => {
      const section = question.section || "Questions";
      grouped.set(section, [...(grouped.get(section) || []), question]);
    });
  return [...grouped.entries()].map(([section, items]) => ({ items, section }));
};

export default function AttendeeQuestionnaireScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const responseId = getStringParam(id);
  const { data, isError, isFetching, isLoading, refetch } = useGetEventQuestionnaireQuery(responseId, {
    skip: !responseId,
  });
  const [submitAnswers, { isLoading: isSubmitting }] = useSubmitQuestionnaireAnswersMutation();
  const body = data?.body;
  const questions = useMemo(() => body?.questions || [], [body?.questions]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  useEffect(() => {
    if (!questions.length) return;
    const nextAnswers: AnswerMap = {};
    questions.forEach((question) => {
      nextAnswers[question.id] =
        question.answer !== undefined ? question.answer : question.defaultValue ?? "";
    });
    setAnswers(nextAnswers);
  }, [questions]);

  const sections = useMemo(() => sectionsFromQuestions(questions), [questions]);
  const missingRequired = useMemo(
    () =>
      questions.filter(
        (question) => question.isRequired && answerIsEmpty(answers[question.id])
      ),
    [answers, questions]
  );
  const submitted = Boolean(body?.submittedAt);

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setTouchedSubmit(true);
    if (missingRequired.length) {
      Alert.alert(
        "Required answers missing",
        "Please complete the required questions before submitting."
      );
      return;
    }

    try {
      await submitAnswers({
        answers: questions.map((question) => ({
          answer: answers[question.id] ?? null,
          questionId: question.id,
        })),
        responseId,
      }).unwrap();
      Alert.alert("Questionnaire submitted", "Your answers have been saved for the organizer.");
      refetch();
    } catch (error: any) {
      Alert.alert("Could not submit", error?.data?.body || "Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#9EDD45" />
        <Text className="text-gray-400 mt-3">Loading questionnaire...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-full p-3"
        >
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Questionnaire</Text>
        <TouchableOpacity
          onPress={refetch}
          className="bg-[#1A2432] border border-[#2E3A4D] rounded-full p-3"
        >
          <RefreshCcw color="#E5E7EB" size={18} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-2xl bg-[#8B6BFF]/20 items-center justify-center">
                <ClipboardList color="#A993FF" size={24} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase">
                  Attendee form
                </Text>
                <Text className="text-white text-2xl font-bold mt-1">
                  {body?.event?.title || "Event questionnaire"}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 leading-6">
              {body?.name || "Attendee"} · {body?.email || "No email"}
            </Text>
            {submitted ? (
              <View className="bg-primary/15 border border-primary/30 rounded-xl px-4 py-3 mt-4 flex-row items-center">
                <CheckCircle2 color="#9EDD45" size={18} />
                <Text className="text-primary font-semibold ml-2">
                  Submitted {formatDate(body?.submittedAt)}
                </Text>
              </View>
            ) : (
              <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-4 py-3 mt-4">
                <Text className="text-gray-300">
                  Complete the required details so the organizer can prepare for your attendance.
                </Text>
              </View>
            )}
          </View>

          {isError ? (
            <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
              <HelpCircle color="#EF4444" size={34} />
              <Text className="text-white text-lg font-semibold mt-4">Questionnaire unavailable</Text>
              <Text className="text-gray-400 text-center mt-2">
                This form could not be loaded. The link may be expired or unavailable.
              </Text>
              <TouchableOpacity className="bg-primary px-5 py-3 rounded-xl mt-5" onPress={refetch}>
                <Text className="text-background font-bold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isError && !questions.length ? (
            <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center">
              <CheckCircle2 color="#8B6BFF" size={34} />
              <Text className="text-white text-lg font-semibold mt-4">No questions attached</Text>
              <Text className="text-gray-400 text-center mt-2">
                The organizer has not added questions for this ticket yet.
              </Text>
            </View>
          ) : null}

          {!isError
            ? sections.map(({ items, section }) => (
                <View
                  key={section}
                  className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden mb-4"
                >
                  <View className="p-4 border-b border-[#243044]">
                    <Text className="text-white text-xl font-semibold">{section}</Text>
                    <Text className="text-gray-400 mt-1">
                      {items.length} question{items.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View className="p-4">
                    {items.map((question) => (
                      <QuestionField
                        key={question.id}
                        answer={answers[question.id]}
                        question={question}
                        showError={touchedSubmit && question.isRequired && answerIsEmpty(answers[question.id])}
                        onChange={(value) => setAnswer(question.id, value)}
                      />
                    ))}
                  </View>
                </View>
              ))
            : null}

          {!isError && questions.length ? (
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center disabled:opacity-60"
              disabled={isSubmitting || isFetching}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#020817" />
              ) : (
                <>
                  <Send color="#020817" size={18} />
                  <Text className="text-background font-bold ml-2">
                    {submitted ? "Update answers" : "Submit questionnaire"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function QuestionField({
  answer,
  onChange,
  question,
  showError,
}: {
  answer: unknown;
  onChange: (value: unknown) => void;
  question: AttendeeQuestionnaireQuestion;
  showError: boolean;
}) {
  const type = normalizeType(question.type);
  const options = normalizeOptions(question);
  const label = question.label || "Question";

  return (
    <View className="mb-5">
      <View className="flex-row items-start">
        <Text className="text-white font-semibold flex-1 pr-2">
          {label}
          {question.isRequired ? <Text className="text-primary"> *</Text> : null}
        </Text>
      </View>
      {question.description ? (
        <Text className="text-gray-500 mt-1 leading-5">{question.description}</Text>
      ) : null}

      {TEXT_TYPES.has(type) || type === "NUMBER" || type === "DATE" ? (
        <TextInput
          className={`bg-[#1A2432] border rounded-xl px-4 py-3 text-white mt-3 ${
            showError ? "border-red-400" : "border-[#2E3A4D]"
          }`}
          keyboardType={type === "NUMBER" ? "decimal-pad" : "default"}
          placeholder={type === "DATE" ? "YYYY-MM-DD" : "Enter answer"}
          placeholderTextColor="#728097"
          value={stringifyAnswer(answer)}
          onChangeText={onChange}
        />
      ) : null}

      {LONG_TEXT_TYPES.has(type) ? (
        <TextInput
          className={`bg-[#1A2432] border rounded-xl px-4 py-3 text-white mt-3 min-h-[120px] ${
            showError ? "border-red-400" : "border-[#2E3A4D]"
          }`}
          multiline
          placeholder="Enter answer"
          placeholderTextColor="#728097"
          textAlignVertical="top"
          value={stringifyAnswer(answer)}
          onChangeText={onChange}
        />
      ) : null}

      {OPTION_TYPES.has(type) ? (
        <OptionChips options={options} selected={stringifyAnswer(answer)} onSelect={onChange} />
      ) : null}

      {MULTI_TYPES.has(type) ? (
        <MultiOptionChips answer={Array.isArray(answer) ? answer : []} options={options} onChange={onChange} />
      ) : null}

      {type === "BOOLEAN" || type === "YES_NO" ? (
        <OptionChips options={["Yes", "No"]} selected={stringifyAnswer(answer)} onSelect={onChange} />
      ) : null}

      {RATING_TYPES.has(type) ? (
        <OptionChips options={["1", "2", "3", "4", "5"]} selected={stringifyAnswer(answer)} onSelect={onChange} />
      ) : null}

      {!TEXT_TYPES.has(type) &&
      !LONG_TEXT_TYPES.has(type) &&
      !OPTION_TYPES.has(type) &&
      !MULTI_TYPES.has(type) &&
      !RATING_TYPES.has(type) &&
      type !== "BOOLEAN" &&
      type !== "YES_NO" &&
      type !== "NUMBER" &&
      type !== "DATE" ? (
        <TextInput
          className={`bg-[#1A2432] border rounded-xl px-4 py-3 text-white mt-3 ${
            showError ? "border-red-400" : "border-[#2E3A4D]"
          }`}
          placeholder="Enter answer"
          placeholderTextColor="#728097"
          value={stringifyAnswer(answer)}
          onChangeText={onChange}
        />
      ) : null}

      {showError ? <Text className="text-red-300 mt-2">This question is required.</Text> : null}
    </View>
  );
}

function OptionChips({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: string) => void;
  options: string[];
  selected: string;
}) {
  const fallbackOptions = options.length ? options : ["Yes", "No"];
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {fallbackOptions.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity
            key={option}
            className={`rounded-full px-4 py-2 border ${
              active ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
            }`}
            onPress={() => onSelect(option)}
          >
            <Text className={active ? "text-background font-bold" : "text-gray-300 font-semibold"}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MultiOptionChips({
  answer,
  onChange,
  options,
}: {
  answer: unknown[];
  onChange: (value: unknown[]) => void;
  options: string[];
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {options.map((option) => {
        const active = answer.map(String).includes(option);
        return (
          <TouchableOpacity
            key={option}
            className={`rounded-full px-4 py-2 border ${
              active ? "bg-primary border-primary" : "bg-[#1A2432] border-[#2E3A4D]"
            }`}
            onPress={() =>
              onChange(active ? answer.filter((item) => String(item) !== option) : [...answer, option])
            }
          >
            <Text className={active ? "text-background font-bold" : "text-gray-300 font-semibold"}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
