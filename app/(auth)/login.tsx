import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react-native';
import * as Google from 'expo-auth-session/providers/google';
import { useLoginMutation } from '@/redux/api/usersApiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '@/redux/features/auth/authSlice';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [login] = useLoginMutation();
  const router = useRouter();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state:any) => state.auth);
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_EXPO_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
  });
    useFocusEffect(() => {
  if (userInfo) {
   router.push("/(tabs)/home/home1") 
  }
    }, );

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
      const res:any = await login({ username, password }).unwrap();
  
      if (res.code === 200 && res.body) {
        dispatch(setCredentials(res)); // Ensure correct payload structure
        router.push("/(tabs)/home/home1"); // Redirect after successful login
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setError(err?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
      } else {
        setError('Google sign-in cancelled.');
      }
    } catch (err) {
      setError('Google sign-in error. Please try again.');
    }
  };
  // if(userInfo){
  //   router.push("/(tabs)/home/home"); // Redirect after successful login

  // }

  return (
    <View className="flex-1 bg-background p-6">
      <Image 
source={require('../../assets/images/logo.png')}
  style={{ width: 150, height: 50, alignSelf: 'flex-end', marginVertical: 20 }} 
  resizeMode="contain"
/>

      <View className="flex-1 ">
        <Text className="text-white text-3xl font-bold mb-2">Welcome back! 🤗</Text>
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
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <Link href="/forgot-password" className="self-end">
            <Text className="text-primary">Forgot Password?</Text>
          </Link>

          <TouchableOpacity className="bg-primary rounded-lg py-4" onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              
              <View className='flex-row items-center gap-2 justify-center'>
                              <Text className="text-background  text-center text-lg font-bold">Login </Text>
                              <Image
              source={require('../../assets/images/send.png')}
              style={{ width: 24, height: 24 }}
                            className="mr-2"
                          />
           </View> )}
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="flex-1 h-[1px] bg-gray-700" />
            <Text className="mx-4 text-gray-400">or</Text>
            <View className="flex-1 h-[1px] bg-gray-700" />
          </View>

          <TouchableOpacity className="flex-row items-center justify-center bg-[#1A2432] rounded-lg py-4" onPress={handleGoogleSignIn}>
            <Image
source={require('../../assets/images/google.png')}
style={{ width: 24, height: 24 }}
              className="mr-2"
            />
            <Text className="text-white">Sign up with Google</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-400 text-lg">Don't have an account? </Text>
            <Link href="/signup">
              <Text className="text-primary text-lg">Signup</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
