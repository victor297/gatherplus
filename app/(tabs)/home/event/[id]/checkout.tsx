import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Mail } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Event Details</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
          <Text className="text-white text-lg mb-2">Event Name</Text>
          <Text className="text-gray-400">Jazz Night Live</Text>

          <Text className="text-white text-lg mt-4 mb-2">Date</Text>
          <Text className="text-gray-400">Dec 24, 2025</Text>

          <Text className="text-white text-lg mt-4 mb-2">Time</Text>
          <Text className="text-gray-400">0:00 AM - 0:00 PM</Text>

          <Text className="text-white text-lg mt-4 mb-2">Ticket</Text>
          <Text className="text-gray-400">Standard</Text>

          <Text className="text-white text-lg mt-4 mb-2">Number's of Ticket</Text>
          <Text className="text-gray-400">5</Text>
        </View>

        <Text className="text-white text-xl font-semibold mb-4">Attendee Details</Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-white mb-2">Full Name</Text>
            <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Enter your full name"
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View>
            <Text className="text-white mb-2">Email</Text>
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

        <View className="mt-6 mb-4">
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Ticket</Text>
            <Text className="text-white">5</Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary text-xl font-bold">₦200</Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={() => router.push(`/(tabs)/home/event/${1}/summary`)}
          
        >
          <Text className="text-background text-center font-semibold">
            Continue to checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}