import React from "react";
import { Text, View } from "react-native";
import { MapPin } from "lucide-react-native";

interface EventMapPreviewProps {
  address?: string;
  city?: string;
  className?: string;
}

export default function EventMapPreview({
  address,
  city,
  className = "w-full h-40 bg-gray-700 rounded-lg my-3 overflow-hidden",
}: EventMapPreviewProps) {
  return (
    <View className={`${className} items-center justify-center p-4`}>
      <MapPin color="#9EDD45" size={28} />
      <Text className="text-white font-semibold text-center mt-2">
        {address || "Venue location"}
      </Text>
      {city ? (
        <Text className="text-gray-300 text-sm text-center mt-1">{city}</Text>
      ) : null}
    </View>
  );
}
