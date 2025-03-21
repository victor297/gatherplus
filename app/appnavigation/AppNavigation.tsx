import { Stack } from "expo-router";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AppNavigation() {
  const { userInfo } = useSelector((state: any) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const userData = await AsyncStorage.getItem("userInfo");
      setLoading(false);
    };
    checkUser();
  }, []);

  // **Prevent rendering until data is loaded**
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {userInfo ? (
        <Stack.Screen name="(tabs)/home" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
