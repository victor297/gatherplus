import { Stack } from 'expo-router';

export default function CreateEventLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="banner" />
      <Stack.Screen name="ticketing" />
      <Stack.Screen name="review" />
    </Stack>
  );
}