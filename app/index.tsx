import { useEffect, useLayoutEffect, useState } from "react";
import { Redirect, useFocusEffect } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View } from "react-native";


export default function Index() {
  const [loading, setLoading] = useState(true);
  const [storedUser, setStoredUser] = useState(null);
  useFocusEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem("userInfo");

      if (user) {
        const parsedUser = JSON.parse(user);
        setStoredUser(parsedUser);
      }
      setLoading(false);
    };

    checkUser();
  }, );

  if (loading) return <View className="flex-1 bg-background"></View>; // Prevent flicker before checking storage

  if ( storedUser) {
    return <Redirect href="/(tabs)/home/home1" />;
  } else {
    return <Redirect href="/login" />;
  }
}
