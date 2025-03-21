import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Pressable,  } from 'react-native';
import { MapPin, Search, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/features/auth/authSlice';
import { useGetcategoriesQuery } from '@/redux/api/eventsApiSlice';

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch()
  const handlelogout =()=>{
    dispatch(logout())
    router.push("/(auth)/login")
  }
    const { data: categories, isLoading, error }= useGetcategoriesQuery({})
  

  const categories = ['Concerts', 'Sports', 'Theater', 'Festivals'];
  const upcomingEvents = [
    {
      id: 1,
      title: 'Jazz Night Live',
      date: 'Dec 24, 2025',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f'
    },
    {
      id: 2,
      title: 'Tech Conference',
      date: 'Dec 24, 2025',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
    },
    {
      id: 3,
      title: 'Art Exhibition',
      date: 'Dec 24, 2025',
      image: 'https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07'
    }
  ];

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
    }, {
      id: 3,
      title: 'Jazz Night Live',
      venue: 'Downtown Jazz Club',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
    },
    {
      id: 4,
      title: 'Jazz Night Live',
      venue: 'Downtown Jazz Club',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <MapPin size={20} color="#9EDD45" />
            <Text className="text-white ml-2 text-lg font-semibold">Illinois, Chicago</Text>
          </View>
          <TouchableOpacity>
            <Bell size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4  mb-6">
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 py-3 text-white"
            placeholder="Search for events"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-white text-xl font-bold px-4 mb-4" onPress={handlelogout}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-6">
          {categories?.body?.map((category, index) => (
            <TouchableOpacity
              key={index}
              className="bg-[#1A2432] px-6 py-2 rounded-full mr-3"
            >
              <Text className="text-white">{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-4 mb-6">
          <View className="bg-[#1A2432] rounded-lg overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f' }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="p-4">
              <Text className="text-white text-2xl font-bold">Jazz Night Live</Text>
              <Text className="text-gray-400 mb-3">Downtown Jazz Club</Text>
              <View className="bg-primary self-start px-4 py-2 rounded-full">
                <Text className="text-background font-semibold">$30 - $50</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-white text-xl font-bold">Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home/all-events')}>
              <Text className="text-primary">See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
            {upcomingEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                className="bg-[#1A2432] rounded-lg overflow-hidden mr-4 w-48"
              >
                <Image
                  source={{ uri: event.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text className="text-white font-semibold mb-1">{event.title}</Text>
                  <Text className="text-gray-400 text-sm">{event.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-white text-xl font-bold">Explore</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home/explore')}>
              <Text className="text-primary">Show All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex">
          <View className="px-4 flex-row gap-4">

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
          </View>
            </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}