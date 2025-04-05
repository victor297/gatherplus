import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Ticket, Mail, Lock, Bookmark, LogOutIcon } from 'lucide-react-native';
import { useGetProfileQuery } from '@/redux/api/usersApiSlice';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/features/auth/authSlice';

export default function ProfileScreen() {
  const router:any = useRouter();
    const dispatch = useDispatch()
  
  const { data: userProfile, isLoading: isFetchingProfile, error: profileError } = useGetProfileQuery(null);
 
  const handlelogout = async () => {
  await  dispatch(logout())
    // router.push("/(auth)/login")
  }
  const menuItems = [
    {
      icon: <Ticket size={24} color="#6B7280" />,
      title: 'Bookings',
      subtitle: 'Upcoming events, past events',
      route: '/profile/bookings',
    },
    {
      icon: <Mail size={24} color="#6B7280" />,
      title: 'Change Email',
      subtitle: 'Update your email',
      route: '/profile/change-email',
    },
    {
      icon: <Lock size={24} color="#6B7280" />,
      title: 'Password',
      subtitle: 'Update your password',
      route: '/profile/change-password',
    },
    {
      icon: <Bookmark size={24} color="#6B7280" />,
      title: 'Bookmarks',
      subtitle: 'Bookmarks',
      route: '/profile/bookmarks',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
     
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Settings</Text>
      </View>

      {/* Error Handling */}
      {profileError && (
        <View className="px-4 py-4 bg-red-500 rounded-lg mx-4">
          <Text className="text-white text-center">{profileError?.data?.body||`Error fetching profile data. Please try again.`}</Text>
        </View>
      )}

      {/* Loading State */}
      {isFetchingProfile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9EDD45" />
        </View>
      ) : (
        <>
          {/* Profile Info */}
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 border-b border-[#1A2432]"
            onPress={() => router.push('/profile/account-info')}
          >
            <Image
              source={{ uri: userProfile?.body?.image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }}
              className="w-12 h-12 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text className="text-white text-lg">
                {userProfile ? `${userProfile.body.firstname} ${userProfile.body.lastname}` : 'User Name'}
              </Text>
              <Text className="text-gray-400">
                {userProfile?.body?.email || 'user@example.com'}
              </Text>
            </View>
            <ChevronRight color="#6B7280" size={24} />
          </TouchableOpacity>

          {/* Menu Items */}
          <View className="mt-4">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center px-4 py-4 border-b border-[#1A2432]"
                onPress={() => router.push(item.route)}
              >
                {item.icon}
                <View className="ml-3 flex-1">
                  <Text className="text-white">{item.title}</Text>
                  <Text className="text-gray-400 text-sm">{item.subtitle}</Text>
                </View>
                <ChevronRight color="#6B7280" size={24} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    <TouchableOpacity className="bg-primary rounded-lg py-2 w-40 mt-5 self-center"   onPress={handlelogout}
    >
   
              <View className='flex-row items-center gap-2 justify-center'>
                              <Text className="text-white  text-center text-lg font-bold">LogOut </Text>
                              <LogOutIcon color="white" />
           </View>
          </TouchableOpacity>
  
    </View>
  );
}
