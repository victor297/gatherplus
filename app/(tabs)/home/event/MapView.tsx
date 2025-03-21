import React from 'react';
import { View } from 'react-native';

interface MapViewProps {
  className?: string;
}

export default function MapView({ className = '' }: MapViewProps) {
  return (
    <View className={`bg-[#1A2432] ${className}`} />
  );
}