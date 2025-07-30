import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Eye, EyeOff, User, Lock, Mail } from "lucide-react-native";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  useAppleloginMutation,
  useGoogleloginMutation,
  useLoginMutation,
} from "@/redux/api/usersApiSlice";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/redux/features/auth/authSlice";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [login, { isLoading }] = useLoginMutation();
  const [applelogin, { isLoading: isAppleLoading }] = useAppleloginMutation();
  const [googlelogin, { isLoading: isGoogleLoading }] =
    useGoogleloginMutation();
  const router = useRouter();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state: any) => state.auth);
  GoogleSignin.configure({
    webClientId:
      "372220031134-ekkmprp00glp2s41hl2ubjet9metkm4k.apps.googleusercontent.com",
    iosClientId:
      "372220031134-n7q03pko3seg97aut7t6gcgulv2rr0hr.apps.googleusercontent.com",
  });

  useFocusEffect(() => {
    if (userInfo) {
      router.replace("/(tabs)/home/home1");
    }
  });

  const handleSignIn = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res: any = await login({ username, password }).unwrap();

      if (res.code === 200 && res.body) {
        dispatch(setCredentials(res));
        router.replace("/(tabs)/home/home1");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.log(err);
      setError(err?.data?.body || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log(response, "googlelogin1");
      if (isSuccessResponse(response)) {
        const res: any = await googlelogin({
          googleId: response.data.idToken,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.photo,
          emailVerified: true,
          provider: "google",
        }).unwrap();
        if (res.code === 200 && res.body) {
          dispatch(setCredentials(res));
          router.replace("/(tabs)/home/home1");
        } else {
          setError("No ID token received from Google");
        }
      } else {
        setError("Google sign-in was cancelled");
      }
    } catch (error) {
      setLoading(false);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            setError("Google sign-in was cancelled");
            break;
          case statusCodes.IN_PROGRESS:
            setError("Google sign-in already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError("Google Play services not available or outdated");
            break;
          default:
            setError("Google sign-in failed. Please try again.");
        }
      } else {
        setError("An unknown error occurred during Google sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const res: any = await applelogin(credential).unwrap();
      console.log(res, "applelogin");
      if (res.code === 200 && res.body) {
        dispatch(setCredentials(res));
        router.replace("/(tabs)/home/home1");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      setLoading(false);
      if (e.code === "ERR_CANCELED") {
        setError("Apple sign-in cancelled.");
      } else {
        setError("Apple sign-in error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-6">
      <Image
        source={require("../../assets/images/logo.png")}
        style={{
          width: 150,
          height: 50,
          alignSelf: "flex-end",
          marginVertical: 20,
        }}
        resizeMode="contain"
      />

      <View className="flex-1 ">
        <Text className="text-white text-3xl font-bold mb-2">
          Welcome back! 🤗
        </Text>
        <Text className="text-gray-400 text-sm mb-8">Make it memorable</Text>

        {error && <Text className="text-red-500 mb-4">{error}</Text>}

        <View className="space-y-6">
          <View>
            <Text className="text-white mb-2">Email</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 mb-1 text-lg  py-3 text-white"
                placeholder="Enter your username"
                placeholderTextColor="#6B7280"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">Password</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 mb-1 text-lg  py-3 text-white"
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Link href="/forgot-password" className="self-end">
            <Text className="text-primary">Forgot Password?</Text>
          </Link>

          <TouchableOpacity
            className="bg-primary rounded-lg py-4"
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading || isLoading || isAppleLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-2 justify-center">
                <Text className="text-background  text-center text-lg font-bold">
                  Login
                </Text>
                <Image
                  source={require("../../assets/images/send.png")}
                  style={{ width: 24, height: 24 }}
                  className="mr-2"
                />
              </View>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="flex-1 h-[1px] bg-gray-700" />
            <Text className="mx-4 text-gray-400">or</Text>
            <View className="flex-1 h-[1px] bg-gray-700" />
          </View>

          <View className="space-y-4">
            <TouchableOpacity
              className="flex-row items-center justify-center bg-[#1A2432] rounded-lg py-4"
              onPress={handleGoogleSignIn}
            >
              <Image
                source={require("../../assets/images/google.png")}
                style={{ width: 24, height: 24 }}
                className="mr-2"
              />
              <Text className="text-white">Sign in with Google</Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={8}
                style={{ width: "100%", height: 50 }}
                onPress={handleAppleSignIn}
              />
            )}
          </View>

          <View className="flex-row justify-center">
            <Text className="text-gray-400 text-lg">
              Don't have an account?{" "}
            </Text>
            <Link href="/signup">
              <Text className="text-primary text-lg">Signup</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
