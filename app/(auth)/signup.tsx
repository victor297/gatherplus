import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {  Eye, EyeOff, Mail, User, Lock, ArrowLeftIcon } from 'lucide-react-native';
import { useUsersignupMutation } from '@/redux/api/usersApiSlice';
import * as Google from 'expo-auth-session/providers/google';

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string|null>(null);
  const router = useRouter();
  const [usersignup, { isLoading }] = useUsersignupMutation();
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: 'YOUR_EXPO_CLIENT_ID',
      webClientId: 'YOUR_WEB_CLIENT_ID',
      iosClientId: 'YOUR_IOS_CLIENT_ID',
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
      setError("Password is required");
      return;
    }
    setError(null);
    try {
      const res = await usersignup({ name, email, password }).unwrap();
      router.push(`/verify?email=${email}`);
    } catch (err:any) {
      console.log(err)
      setError(err?.data?.body || 'Signup failed. Please try again.');
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        console.log('Google sign-in successful');
      } else {
        setError('Google sign-in cancelled.');
      }
    } catch (err) {
      setError('Google sign-in error. Please try again.');
    }
  };
  return (
    <View className="flex-1 bg-background p-6">
     <TouchableOpacity onPress={() => router.back()} className="mt-6 flex-row items-center  justify-between">
            <ArrowLeftIcon color="grey" size={24} />
                 <Image 
            source={require('../../assets/images/logo.png')}
              style={{ width: 150, height: 50, alignSelf: 'flex-end'}} 
              resizeMode="contain"
            />
          </TouchableOpacity>
    

      <View className="mt-4">
        <Text className="text-white text-3xl font-bold">Nice to know you! 👋</Text>
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
                textContentType='name'
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

        {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}

        <TouchableOpacity 
          className="bg-primary rounded-lg py-4 mt-8 flex items-center justify-center"
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className='flex-row items-center gap-2 justify-center'>
                                         <Text className="text-background  text-center text-lg font-bold">Create Account </Text>
                                         <Image
                         source={require('../../assets/images/send.png')}
                         style={{ width: 24, height: 24 }}
                                       className="mr-2"
                                     />
                      </View>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-center mt-6 mb-4">or</Text>

 
           <TouchableOpacity className="flex-row items-center justify-center bg-[#1A2432] rounded-lg py-4" onPress={handleGoogleSignIn}>
             <Image
 source={require('../../assets/images/google.png')}
 style={{ width: 24, height: 24 }}
               className="mr-2"
             />
             <Text className="text-white ">Sign up with Google</Text>
           </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400 text-lg">Already have an account? </Text>
          <Link href="/login" className="text-primary text-lg">
            Log In
          </Link>
        </View>
      </View>
    </View>
  );
}
