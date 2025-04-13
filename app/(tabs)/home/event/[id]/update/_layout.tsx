import { Stack } from 'expo-router';

export default function UpdateEventLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="updatecreate" />
      <Stack.Screen name="updatebanner" />
      <Stack.Screen name="updateticketing" />
      <Stack.Screen name="updatereview" />
    </Stack>
  );
}