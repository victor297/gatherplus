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
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/[id]/preview" />
      <Stack.Screen name="events/[id]/check-in" />
      <Stack.Screen name="events/[id]/participants" />
      <Stack.Screen name="events/[id]/questionnaire-responses" />
      <Stack.Screen name="attendees/index" />
      <Stack.Screen name="attendees/[email]" />
      <Stack.Screen name="revenue" />
    </Stack>
  );
}
