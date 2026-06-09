import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, MessageSquareText, Star } from "lucide-react-native";

type SuccessFeedbackViewProps = {
  title: string;
  subtitle: string;
};

const ratingOptions = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

export default function SuccessFeedbackView({
  title,
  subtitle,
}: SuccessFeedbackViewProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const goHome = () => {
    router.replace("/(tabs)/home/home1" as any);
  };

  const handleSendFeedback = () => {
    Alert.alert("Feedback received", "Thank you for sharing your experience.", [
      { text: "OK", onPress: goHome },
    ]);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 72,
            paddingBottom: 28,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <View className="h-24 w-24 rounded-full bg-primary/15 border border-primary/40 items-center justify-center">
              <View className="h-16 w-16 rounded-full bg-primary items-center justify-center">
                <CheckCircle2 size={36} color="#06101F" />
              </View>
            </View>

            <Text className="text-white text-3xl font-black mt-6 text-center">
              {title}
            </Text>
            <Text className="text-gray-400 text-base text-center mt-2 leading-6">
              {subtitle}
            </Text>
          </View>

          <View className="bg-[#111823] border border-[#243044] rounded-3xl p-5 mt-10">
            <View className="flex-row items-start mb-5">
              <View className="h-11 w-11 rounded-2xl bg-primary/15 items-center justify-center mr-3">
                <MessageSquareText size={22} color="#9EDD45" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  How was the flow?
                </Text>
                <Text className="text-gray-400 mt-1">
                  Rate the create and checkout experience.
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-5">
              {ratingOptions.map((option) => {
                const selected = rating === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setRating(option.value)}
                    className={`items-center justify-center rounded-2xl border px-2 py-3 w-[18%] ${
                      selected
                        ? "bg-primary border-primary"
                        : "bg-[#1A2432] border-[#2A3546]"
                    }`}
                  >
                    <Star
                      size={17}
                      color={selected ? "#06101F" : "#728097"}
                      fill={selected ? "#06101F" : "transparent"}
                    />
                    <Text
                      className={`text-[10px] font-bold mt-1 ${
                        selected ? "text-background" : "text-gray-400"
                      }`}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-white font-semibold mb-2">
              Tell us what to improve
            </Text>
            <TextInput
              className="w-full h-28 bg-[#1A2432] border border-[#2A3546] rounded-2xl px-4 py-3 text-white mb-5"
              placeholder="Optional feedback..."
              placeholderTextColor="#728097"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              className="bg-primary w-full py-4 rounded-2xl items-center"
              onPress={handleSendFeedback}
            >
              <Text className="text-background font-black text-base">
                Send feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goHome}
              className="border border-[#344156] w-full py-4 rounded-2xl items-center mt-3"
            >
              <Text className="text-gray-300 font-semibold">Back home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
