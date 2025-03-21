import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account-info" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="change-email" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}