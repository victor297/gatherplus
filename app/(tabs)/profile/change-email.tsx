import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useUpdateEmailMutation } from '@/redux/api/usersApiSlice';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [updateEmail, { isLoading, error }] = useUpdateEmailMutation();

  const handleSave = async () => {
    try {
      const data = {email:email}
    const res=  await updateEmail( data ).unwrap();
      router.back(); // Navigate back on success
    } catch (err:any) {
      console.log('Failed to update email:', err?.data?.body);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Change Email</Text>
      </View>

      {/* Error Message */}
      {error && (
          <Text className="text-red-500 mx-4">{error?.data?.body}</Text>
      )}

      {/* Input Field */}
      <View className="flex-1 px-4">
        <View>
          <Text className="text-white mb-2">Email <Text className="text-red-500">*</Text></Text>
          <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
            <Mail size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-white"
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`bg-primary rounded-lg py-4 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-background text-center font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
