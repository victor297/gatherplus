import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share2, MapPin, Calendar, Clock, Plus, Minus } from 'lucide-react-native';
import MapView from './MapView';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  console.log(id)
  const [ticketCounts, setTicketCounts] = useState({
    standard: 0,
    vip: 0,
    premium: 0
  });

  const updateTicketCount = (type: keyof typeof ticketCounts, increment: boolean) => {
    setTicketCounts(prev => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1)
    }));
  };

  const totalAmount = (ticketCounts.standard * 200) + (ticketCounts.vip * 300) + (ticketCounts.premium * 500);
  const totalTickets = ticketCounts.standard + ticketCounts.vip + ticketCounts.premium;

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3' }}
          className="w-full h-72"
          resizeMode="cover"
        />
        
        <View className="absolute w-full flex-row justify-between items-center p-4 pt-12">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Share2 color="white" size={24} />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-white text-2xl font-bold mb-2">Jazz Night Live</Text>
          <Text className="text-gray-400 mb-6">Downtown Jazz Club</Text>

          <Text className="text-white text-xl font-semibold mb-4">About Event</Text>
          <Text className="text-gray-400 mb-6">
            Get ready to kick off the Christmas season in Mumbai with our hot Jazz 2019 - your favourite
            LIVE Christmas concert!{'\n\n'}
            LOGAN Groups invites you to the 5th edition of our annual Christmas festivities. Try the good and be the
            youth fest, join favourite worship leaders, centre, quizzes and some exciting surprises!
          </Text>

          <Text className="text-white text-xl font-semibold mb-4">Location</Text>
          <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
            <Text className="text-white mb-2">The Grand Hall</Text>
            <Text className="text-gray-400 mb-4">Kensington Town Hall, Horton Street, London W8 7NX, United Kingdom</Text>
            <MapView className="w-full h-32 rounded-lg mb-2" />
            <TouchableOpacity>
              <Text className="text-primary">View map</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white text-xl font-semibold mb-4">Date and Time</Text>
          <View className="flex-row mb-6">
            <View className="flex-row items-center mr-6">
              <Calendar className="text-gray-400 mr-2" size={20} />
              <Text className="text-gray-400">Dec 24, 2025</Text>
            </View>
            <View className="flex-row items-center">
              <Clock className="text-gray-400 mr-2" size={20} />
              <Text className="text-gray-400">9:00 AM - 10:00 PM</Text>
            </View>
          </View>

          <Text className="text-white text-xl font-semibold mb-4">Ticket Information</Text>
          <View className="space-y-4">
            {[
              { type: 'standard', label: 'Standard Ticket', price: 200 },
              { type: 'vip', label: 'VIP Ticket', price: 300 },
              { type: 'premium', label: 'Premium Ticket', price: 500 }
            ].map((ticket) => (
              <View key={ticket.type} className="flex-row items-center justify-between bg-[#1A2432] p-4 rounded-lg">
                <View>
                  <Text className="text-white">{ticket.label}</Text>
                  <Text className="text-primary">₦ {ticket.price} each</Text>
                </View>
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity
                    onPress={() => updateTicketCount(ticket.type as keyof typeof ticketCounts, false)}
                    className="bg-background p-2 rounded-full"
                  >
                    <Minus size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text className="text-white w-6 text-center">
                    {ticketCounts[ticket.type as keyof typeof ticketCounts]}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateTicketCount(ticket.type as keyof typeof ticketCounts, true)}
                    className="bg-background p-2 rounded-full"
                  >
                    <Plus size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-4 mb-4">
            <Text className="text-gray-400">Amount of tickets ({totalTickets})</Text>
            <Text className="text-white text-xl font-bold">₦ {totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={() => router.push(`/(tabs)/home/event/${id}/checkout`)}
          disabled={totalTickets === 0}
        >
          <Text className="text-background text-center font-semibold">
            Buy Tickets
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}