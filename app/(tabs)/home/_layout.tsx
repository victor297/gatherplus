import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home1" />
      <Stack.Screen name="all-events" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}