import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowLeftIcon, Mail } from 'lucide-react-native';
import { useForgetpasswordMutation } from '@/redux/api/usersApiSlice';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [forgetpassword, { isLoading }] = useForgetpasswordMutation();

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setError(null);
      await forgetpassword({ email }).unwrap();
      router.push(`/reset-password?email=${email}`);
    } catch (err:any) {
      setError(err?.data?.body || 'Failed to send reset email');
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

      <View className="mt-8">
        <Text className="text-white text-3xl font-bold">Forgot Password</Text>
        <Text className="text-gray-400 mt-2">
          Oops! Forgot your password? Enter your email below to reset it.
        </Text>

        <View className="mt-8">
          <Text className="text-white mb-2">Email</Text>
          <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
            <Mail size={22} color="#6B7280" />
            <TextInput
              className="flex-1 text-lg ml-3 mb-1 text-white"
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {error && <Text className="text-red-500 mt-2">{error}</Text>}
        </View>

        <TouchableOpacity 
          className={`bg-primary rounded-lg py-4 mt-8 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handlePasswordReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
               <View className='flex-row items-center gap-2 justify-center'>
                                          <Text className="text-background  text-center text-lg font-bold"> Recover Account
                                          </Text>
                                          <Image
                          source={require('../../assets/images/send.png')}
                          style={{ width: 24, height: 24 }}
                                        className="mr-2"
                                      />
                       </View> 
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')} className="mt-4 flex-row justify-center items-center"> 
        <ArrowLeft className='text-primary' />
          <Text className="text-primary text-center"> Back to login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
