import React, { ReactNode } from "react";
import { View } from "react-native";

type MapViewProps = {
  children?: ReactNode;
  style?: object;
};

type MarkerProps = {
  children?: ReactNode;
};

export function Marker({ children }: MarkerProps) {
  return <>{children}</>;
}

export default function MapView({ children, style }: MapViewProps) {
  return <View style={style}>{children}</View>;
}
