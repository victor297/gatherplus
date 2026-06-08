import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

type FoundationStat = {
  label: string;
  value: string | number;
};

type ProfileFoundationScreenProps = {
  children?: React.ReactNode;
  isLoading?: boolean;
  stats?: FoundationStat[];
  subtitle?: string;
  title: string;
};

export default function ProfileFoundationScreen({
  children,
  isLoading = false,
  stats = [],
  subtitle,
  title,
}: ProfileFoundationScreenProps) {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-semibold">{title}</Text>
          {!!subtitle && (
            <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        {stats.length > 0 ? (
          <View className="flex-row flex-wrap gap-3 mb-5">
            {stats.map((stat) => (
              <View
                key={stat.label}
                className="bg-[#1A2432] rounded-lg p-4 min-w-[30%] flex-1"
              >
                <Text className="text-primary text-2xl font-bold">
                  {stat.value}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {children}
      </ScrollView>
    </View>
  );
}
