import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Key, ArrowLeftIcon } from 'lucide-react-native';
import { useResetpasswordMutation } from '@/redux/api/usersApiSlice';

export default function ResetPassword() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [resetPassword, { isLoading }] = useResetpasswordMutation();

  const handleResetPassword = async () => {
    if (!code.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      await resetPassword({ email, code, password }).unwrap();
      
      router.push('/login');
    } catch (err:any) {
      setError(err?.data?.body || 'Failed to reset password');
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
        <Text className="text-white text-3xl font-bold">Reset Password</Text>
        <Text className="text-gray-400 mt-2">Enter the code sent to your email and set a new password.</Text>

        <View className="mt-8 space-y-6">
          <View>
            <Text className="text-white mb-2">Verification Code</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <Key size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg  py-3 text-white"
                placeholder="Enter verification code"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">New Password</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg  py-3 text-white"
                placeholder="Create your password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">Confirm Password</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-lg  py-3 text-white"
                placeholder="Re-enter your password"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {error && <Text className="text-red-500 mt-2">{error}</Text>}

      <TouchableOpacity 
                className="bg-primary rounded-lg py-4 mt-8"
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                
                 <View className='flex-row items-center gap-2 justify-center'>
                                              <Text className="text-background  text-center text-lg font-bold">{isLoading ? <ActivityIndicator color="white" /> : <Text className="text-background text-center font-semibold">Reset Password</Text>}
                                              </Text><Image
                              source={require('../../assets/images/send.png')}
                              style={{ width: 24, height: 24 }}
                                            className="mr-2"
                                          />
                           </View>
              </TouchableOpacity>
      </View>
    </View>
  );
}
