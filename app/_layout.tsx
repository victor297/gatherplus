import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from "react-redux";
import { initializeUserInfo } from '@/redux/features/auth/authSlice';
import store from '@/redux/store';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  store.dispatch(initializeUserInfo());
  useEffect(() => {
    window.frameworkReady?.();
  }, []);
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
      </Stack>
      <StatusBar style="light" />
    </Provider>
  );
}