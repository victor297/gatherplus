import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const events = [
  {
    id: 1,
    title: 'Event title that can go up to two lines',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f',
    date: 'Dec 24, 2025',
    time: '0:00 AM - 0:00 PM',
    interested: 10,
    price: 499
  },
  {
    id: 2,
    title: 'Event title that can go up to two lines',
    image: 'https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07',
    date: 'Dec 24, 2025',
    time: '0:00 AM - 0:00 PM',
    interested: 10,
    price: 499
  },
  {
    id: 3,
    title: 'Event title that can go up to two lines',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    date: 'Dec 24, 2025',
    time: '0:00 AM - 0:00 PM',
    interested: 10,
    price: 499
  }
];

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">My Bookings</Text>
      </View>

      <View className="flex-row px-4 border-b border-[#1A2432]">
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'upcoming' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text className={activeTab === 'upcoming' ? 'text-primary' : 'text-gray-400'}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-4 px-6 ${activeTab === 'past' ? 'border-b-2 border-primary' : ''}`}
          onPress={() => setActiveTab('past')}
        >
          <Text className={activeTab === 'past' ? 'text-primary' : 'text-gray-400'}>
            Past Events
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            className="bg-[#1A2432] rounded-lg overflow-hidden mb-4"
            onPress={() => router.push(`/event/${event.id}`)}
          >
            <Image
              source={{ uri: event.image }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
              <Text className="text-white text-lg font-semibold mb-2">
                {event.title}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-sm">{event.date}</Text>
                  <Text className="text-gray-400 text-sm ml-4">{event.time}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-amber-400 mr-2">★</Text>
                  <Text className="text-gray-400">{event.interested} interested</Text>
                </View>
              </View>
              <View className="mt-2">
                <Text className="text-primary text-lg font-semibold">
                  ₦ {event.price}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}