import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MessageCircle, User, Clock, ArrowLeft } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { useGetAllChatsQuery } from "@/redux/api/providersApiSlice";

export default function ChatListScreen() {
  const { data: chats, isLoading, isError } = useGetAllChatsQuery({});
  const router = useRouter();

  const renderChatItem = ({ item }) => {
    const lastMessage = item.providerChat[0]?.message || "No messages yet";
    const lastMessageTime = item.providerChat[0]?.created_at
      ? new Date(item.providerChat[0].created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Link
        href={`/(provider)/(chats)/${item.id}?name=${encodeURIComponent(
          item.profile.name
        )}`}
        asChild
      >
        <TouchableOpacity className="bg-lightbackground p-4 mb-2 rounded-lg mx-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary p-2 rounded-full mr-3">
                <User size={20} color="#020E1E" />
              </View>
              <View>
                <Text className="text-white font-bold">
                  {item.profile.name}
                </Text>
                <Text className="text-gray-400">{lastMessage}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Clock size={16} color="#9EDD45" className="mr-1" />
              <Text className="text-primary text-xs">{lastMessageTime}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-4">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4  pb-4">
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/profile")}
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
            <Text className="text-white">Error loading chats</Text>
          </View>
        ) : (
          <FlatList
            data={chats?.body?.result || []}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-10">
                <MessageCircle size={48} color="#9EDD45" />
                <Text className="text-white mt-4 text-lg">No chats yet</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
