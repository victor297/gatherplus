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
    <Stack screenOptions={{ headerShown: false, animation:'slide_from_bottom' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation:'slide_from_bottom' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    window.frameworkReady?.();
  }, []);
  return (
      <StripeProvider merchantIdentifier="merchant.REPLACE_ME" publishableKey="pk_test_51Nk1wiFLuyhBQgukGDJJb5uq2EKd8olb2Yy6Bbm9m2GiXsObMKJEcZ4M88KKwSOYcPylFlfCz0RHwiov5U0F6ykv00TMcLXTUJ">
    <Provider store={store}>
      <RootLayoutContent />
      <StatusBar style="light" />
    </Provider>
    </StripeProvider>
  );
}