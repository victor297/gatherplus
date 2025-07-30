import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  ArrowLeftIcon,
} from "lucide-react-native";
import {
  useAppleloginMutation,
  useGoogleloginMutation,
  useUsersignupMutation,
} from "@/redux/api/usersApiSlice";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/redux/features/auth/authSlice";

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [usersignup, { isLoading }] = useUsersignupMutation();
  const [applelogin, { isLoading: isAppleLoading }] = useAppleloginMutation();
  const [googlelogin, { isLoading: isGoogleLoading }] =
    useGoogleloginMutation();

  const { userInfo } = useSelector((state: any) => state.auth);
  GoogleSignin.configure({
    webClientId:
      "372220031134-ekkmprp00glp2s41hl2ubjet9metkm4k.apps.googleusercontent.com",
    iosClientId:
      "372220031134-n7q03pko3seg97aut7t6gcgulv2rr0hr.apps.googleusercontent.com",
  });

  const handleSignup = async () => {
    if (!name.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    try {
      const res = await usersignup({ name, email, password }).unwrap();
      router.push(`/verify?email=${email}`);
    } catch (err: any) {
      setError(err?.data?.body || "Signup failed. Please try again.");
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
      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-6 flex-row items-center justify-between"
      >
        <ArrowLeftIcon color="grey" size={24} />
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 150, height: 50, alignSelf: "flex-end" }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View className="mt-4">
        <Text className="text-white text-3xl font-bold">
          Nice to know you! 👋
        </Text>
        <Text className="text-gray-400 mt-2">
          Sign up to discover and book amazing events!
        </Text>

        <View className="mt-8 space-y-6">
          <View>
            <Text className="text-white mb-2">Full Name</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 ">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg mb-1 py-3 text-white"
                placeholder="Enter your full name"
                placeholderTextColor="#6B7280"
                value={name}
                textContentType="name"
                onChangeText={setName}
              />
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">Email</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 ">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg mb-1 py-3 text-white"
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">Password</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 ">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg mb-1 py-3 text-white"
                placeholder="Create your password"
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
            <Text className="text-gray-400 text-sm mt-2">
              Must be at least 8 characters.
            </Text>
          </View>
        </View>

        {error && (
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        )}

        <TouchableOpacity
          className="bg-primary rounded-lg py-4 mt-8 flex items-center justify-center"
          onPress={handleSignup}
          disabled={isLoading}
        >
          {loading || isLoading || isAppleLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center gap-2 justify-center">
              <Text className="text-background text-center text-lg font-bold">
                Create Account
              </Text>
              <Image
                source={require("../../assets/images/send.png")}
                style={{ width: 24, height: 24 }}
                className="mr-2"
              />
            </View>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mt-6 mb-4">
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
            <Text className="text-white">Sign up with Google</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
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

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400 text-lg">
            Already have an account?{" "}
          </Text>
          <Link href="/login" className="text-primary text-lg">
            Log In
          </Link>
        </View>
      </View>
    </View>
  );
}
