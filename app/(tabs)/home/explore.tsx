import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Bell, Filter } from 'lucide-react-native';

const exploreEvents = [
  {
    id: 1,
    title: 'Jazz Night Live',
    venue: 'Downtown Jazz Club',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
  },
  {
    id: 2,
    title: 'Jazz Night Live',
    venue: 'Downtown Jazz Club',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
  },
  {
    id: 3,
    title: 'Jazz Night Live',
    venue: 'Downtown Jazz Club',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
  }
];

export default function ExploreScreen() {
  const router = useRouter();
  const categories = ['Concerts', 'Sports', 'Theater', 'Festivals'];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Explore</Text>
        </View>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity>
            <Search color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Filter color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Bell color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4">
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            className="bg-[#1A2432] px-6 py-2 rounded-full mr-3"
          >
            <Text className="text-white">{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4">
        {exploreEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            className="bg-[#1A2432] rounded-lg overflow-hidden mb-4"
          >
            <Image
              source={{ uri: event.image }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
              <Text className="text-white text-xl font-semibold">{event.title}</Text>
              <Text className="text-gray-400 mb-4">{event.venue}</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row">
                  {[1, 2, 3].map((avatar) => (
                    <Image
                      key={avatar}
                      source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }}
                      className="w-8 h-8 rounded-full border-2 border-[#1A2432] -ml-2 first:ml-0"
                    />
                  ))}
                </View>
                <TouchableOpacity className="bg-primary px-6 py-2 rounded-full">
                  <Text className="text-background font-semibold">Join now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}