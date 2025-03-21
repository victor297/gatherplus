import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useUpdatePasswordMutation } from '@/redux/api/usersApiSlice';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState<any>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [updatePassword, { isLoading, error }] = useUpdatePasswordMutation();

  const handleSave = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    
    try {
      await updatePassword(passwords).unwrap();
      router.back(); // Navigate back on success
    } catch (err) {
      console.error('Failed to update password:', err);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Change Password</Text>
      </View>
  {error && (
          <Text className="text-red-500 mx-4">{error?.data?.body}</Text>
      )}


      <View className="flex-1 px-4 space-y-4">
        {[ 
          { label: 'Current Password', key: 'currentPassword', show: showCurrentPassword, setShow: setShowCurrentPassword },
          { label: 'New Password', key: 'newPassword', show: showNewPassword, setShow: setShowNewPassword },
          { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirmPassword, setShow: setShowConfirmPassword }
        ].map(({ label, key, show, setShow }) => (
          <View key={key}>
            <Text className="text-white mb-2">{label} <Text className="text-red-500">*</Text></Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 ">
              <TextInput
                className="flex-1 text-white py-3 mb-1"
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#6B7280"
                secureTextEntry={!show}
                value={passwords[key]}
                onChangeText={(text) => setPasswords({ ...passwords, [key]: text })}
              />
              <TouchableOpacity onPress={() => setShow(!show)}>
                {show ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

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
