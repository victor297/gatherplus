import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useUpdatePasswordMutation } from '@/redux/api/usersApiSlice';
import { Alert } from 'react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
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
      router.back();
    } catch (err) {
                  Alert.alert("Try Again", err?.data?.body|| "Failed update password");
      
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
          <Text className="text-white text-xl font-semibold">Change Password</Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <Text className="text-red-500 mx-4">{error?.data?.body}</Text>
      )}

      {/* Inputs */}
      <View className=" px-4 space-y-4">
        {[
          { label: 'Current Password', key: 'currentPassword', show: showCurrentPassword, setShow: setShowCurrentPassword },
          { label: 'New Password', key: 'newPassword', show: showNewPassword, setShow: setShowNewPassword },
          { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirmPassword, setShow: setShowConfirmPassword }
        ].map(({ label, key, show, setShow }) => (
          <View key={key}>
            <Text className="text-white mb-2">{label} <Text className="text-red-500">*</Text></Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4">
              <TextInput
                className="flex-1 text-white text-lg py-3"
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#6B7280"
                secureTextEntry={!show}
                value={passwords[key]}
                onChangeText={(text) => setPasswords({ ...passwords, [key]: text })}
              />
              <TouchableOpacity onPress={() => setShow(!show)} className="ml-2">
                {show ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>
        ))}
            {/* Save Button */}
      <View className="px-4 mt-4">
        <TouchableOpacity
          className={`bg-[#9EDD45] flex-row items-center justify-center self-end px-5 py-3 rounded-lg ${isLoading ? 'opacity-50' : ''}`}
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

  
    </View>
  );
}
