import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface EventMapPreviewProps {
  address?: string;
  city?: string;
  className?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_LATITUDE = 51.5074;
const DEFAULT_LONGITUDE = -0.1278;

export default function EventMapPreview({
  address,
  city,
  className = "w-full h-40 bg-gray-700 rounded-lg my-3 overflow-hidden",
  latitude = DEFAULT_LATITUDE,
  longitude = DEFAULT_LONGITUDE,
}: EventMapPreviewProps) {
  return (
    <View className={className}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={address}
          description={city}
        />
      </MapView>
    </View>
  );
}
