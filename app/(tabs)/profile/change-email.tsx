import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useUpdateEmailMutation } from '@/redux/api/usersApiSlice';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [updateEmail, { isLoading, error }] = useUpdateEmailMutation<any>();

  const handleSave = async () => {
    try {
      const res = await updateEmail({ email }).unwrap();
      router.back();

    } catch (err: any) {
      console.log('Failed to update email:', err?.data);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Change Email</Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-red-500 mx-4">{error?.data?.body}</Text>
      )}

      {/* Input Field */}
      <View className="mb-2 px-4">
        <Text className="text-white mb-2">Email <Text className="text-red-500">*</Text></Text>
        <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
          <Mail size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-xl py-3 text-white"
            placeholder="Enter your email"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Save Button aligned to right */}
      <View className="px-4 mt-4">
        <TouchableOpacity
          className={`bg-[#9EDD45] flex-row items-center justify-center self-end px-5 py-2 rounded-lg ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A2432" />
          ) : (
            <Text className="text-[#1A2432] font-semibold text-lg">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
