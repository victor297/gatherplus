import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Send, User, MessageCircle, ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  useCreateChatMutation,
  useGetChatDetailsQuery,
} from "@/redux/api/providersApiSlice";
import { useRouter } from "expo-router";

export default function ChatDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const { userInfo } = useSelector((state: any) => state.auth);
  const router = useRouter();

  const {
    data: chatDetails,
    isLoading,
    isError,
    refetch,
  } = useGetChatDetailsQuery(id);
  const [createChat, { isLoading: isSending }] = useCreateChatMutation();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await createChat({
        provider_user_id: Number(id),
        user_id: Number(userInfo?.sub),
        message: message,
        sender: "PROVIDER",
        is_reply: true,
      }).unwrap();

      setMessage("");
      refetch();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isProvider = item.sender === "PROVIDER";
    const messageTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View className={`mb-4 mx-4 ${isProvider ? "items-end" : "items-start"}`}>
        <View
          className={`p-3 rounded-lg max-w-[80%] ${
            isProvider ? "bg-primary" : "bg-lightbackground"
          }`}
        >
          <Text className={isProvider ? "text-background" : "text-white"}>
            {item.message}
          </Text>
        </View>
        <Text
          className={`text-xs mt-1 ${
            isProvider ? "text-primary" : "text-gray-400"
          }`}
        >
          {messageTime}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1  bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
        keyboardVerticalOffset={90}
      >
        <View className="flex-row items-center px-4  pb-4">
          <TouchableOpacity
            onPress={() => router.replace("/(provider)/(chats)/chats")}
            className="mr-4 bg-[#1A2432] p-2 rounded-full"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Messages</Text>
        </View>
        {isLoading ? (
          <View className="flex-1 bg-background items-center justify-center">
            <ActivityIndicator size="large" color="#9EDD45" />
          </View>
        ) : isError ? (
          <View className="flex-1 bg-background items-center justify-center">
            <Text className="text-white">Error loading chat Detail</Text>
          </View>
        ) : (
          <View className="flex-1">
            {chatDetails?.body?.length > 0 ? (
              <FlatList
                data={chatDetails?.body || []}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 16 }}
                inverted
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <MessageCircle size={48} color="#9EDD45" />
                <Text className="text-white mt-4 text-lg">No messages yet</Text>
                <Text className="text-gray-400 mt-2">
                  Start the conversation
                </Text>
              </View>
            )}
          </View>
        )}
        <View className="p-4 bg-lightbackground">
          <View className="flex-row items-center bg-background rounded-full px-4">
            <TextInput
              className="flex-1 text-white py-3"
              placeholder="Type a message..."
              placeholderTextColor="#6B7280"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isSending || !message.trim()}
              className="ml-2"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#9EDD45" />
              ) : (
                <Send
                  size={24}
                  color={message.trim() ? "#9EDD45" : "#6B7280"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
