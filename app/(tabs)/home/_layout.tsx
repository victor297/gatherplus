import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home1" options={{animation:"slide_from_bottom", animationDuration:100}} />
      <Stack.Screen name="all-events" options={{animation:"slide_from_bottom", animationDuration:100}} />
      <Stack.Screen name="explore" options={{animation:"slide_from_bottom", animationDuration:100}} />
    </Stack>
  );
}