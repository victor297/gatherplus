import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const bookmarkedEvents = [
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
  }
];

export default function BookmarksScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Bookmarks</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {bookmarkedEvents.map((event) => (
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