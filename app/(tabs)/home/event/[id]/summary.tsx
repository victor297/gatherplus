import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function OrderSummaryScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Order Summary</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-white text-xl mb-4">Tickets</Text>
        
        <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white font-semibold">Standard Ticket</Text>
              <Text className="text-gray-400">Emmanuel Kachikwu</Text>
              <Text className="text-gray-400">nomsokach@example.com</Text>
            </View>
            <Text className="text-primary font-bold">₦200</Text>
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-white text-xl mb-4">Tickets</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Regular</Text>
              <Text className="text-white">5</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Standard</Text>
              <Text className="text-white">5</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Reserved</Text>
              <Text className="text-white">5</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#1A2432] my-4" />

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Sub-total</Text>
              <Text className="text-white">₦190,000</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Tax</Text>
              <Text className="text-white">₦10,000</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#1A2432] my-4" />

          <View className="flex-row justify-between">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary text-xl font-bold">₦200,000</Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={() => router.push(`/event/${id}/success`)}
        >
          <Text className="text-background text-center font-semibold">
            Pay Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}