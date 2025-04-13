import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider,useDispatch } from "react-redux";
import { initializeUserInfo } from '@/redux/features/auth/authSlice';
import store from '@/redux/store';
import { StripeProvider } from '@stripe/stripe-react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

function RootLayoutContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    store.dispatch(initializeUserInfo());
  }, [dispatch]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    window.frameworkReady?.();
  }, []);
  return (
      <StripeProvider merchantIdentifier="merchant.REPLACE_ME" publishableKey="pk_test_qblFNYngBkEdjEZ16jxxoWSM">
    <Provider store={store}>
      <RootLayoutContent />
      <StatusBar style="light" />
    </Provider>
    </StripeProvider>
  );
}