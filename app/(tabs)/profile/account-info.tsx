import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Edit3Icon, Mail, MapPin, Phone, User } from 'lucide-react-native';
import { useDeleteProfileMutation, useGetProfileQuery } from '@/redux/api/usersApiSlice';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/features/auth/authSlice';

const { width, height } = Dimensions.get('window');

export default function AccountInfoScreen() {
  const router = useRouter();
  const dispatch:any = useDispatch();
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    image_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(30);
  const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDeleteEnabled, setIsDeleteEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: userProfile, isLoading: isFetchingProfile, error: profileError } = useGetProfileQuery(null);
  const [deleteProfile, {isLoading: isDeletingProfile, error: deleteError}] = useDeleteProfileMutation();

  useEffect(() => {
    if (isFetchingProfile) {
      setIsLoading(true);
    } else if (profileError) {
      setError('Failed to fetch profile data');
      setIsLoading(false);
    } else if (userProfile) {
      setProfileData({
        firstname: userProfile?.body?.firstname || '',
        lastname: userProfile?.body?.lastname || '',
        phone: userProfile?.body?.phone || '',
        email: userProfile?.body?.email || '',
        address: userProfile?.body?.address || '',
        image_url: userProfile?.body?.image_url || '',
      });
      setIsLoading(false);
    }
  }, [userProfile, isFetchingProfile, profileError]);

  const fullName = `${profileData.firstname} ${profileData.lastname}`.trim();

  const startDeleteCountdown = () => {
    setShowDeleteModal(true);
    setDeleteCountdown(30);
    setIsDeleteEnabled(false);
    
    if (deleteTimer) {
      clearInterval(deleteTimer);
    }

    const timer = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDeleteEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setDeleteTimer(timer);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    if (deleteTimer) {
      clearInterval(deleteTimer);
      setDeleteTimer(null);
    }
    setIsDeleteEnabled(false);
  };

  const confirmDelete = async () => {
    if (!isDeleteEnabled) return;
    
    try {
      await deleteProfile(null).unwrap();
        await dispatch(logout());
      
      router.replace('/auth/sign-in');

    } catch (err) {
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (deleteTimer) {
        clearInterval(deleteTimer);
      }
    };
  }, [deleteTimer]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Account Info</Text>
        </View>
        <TouchableOpacity className='bg-[#9EDD45] py-1 px-2 rounded-lg' onPress={() => router.push('/profile/edit-profile')}>
          <Edit3Icon color="#1A2432" size={24} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9EDD45" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <>
          {/* Profile Content */}
          <View className="items-center mt-8">
            <View className="relative">
              <Image
                source={{ uri: profileData.image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }}
                className="w-24 h-24 rounded-full"
              />
              <TouchableOpacity className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
                <Camera size={20} color="#020E1E" />
              </TouchableOpacity>
            </View>
            <Text className="text-white text-xl mt-4">{fullName || 'N/A'}</Text>
            <Text className="text-gray-400">{profileData.email || 'No email available'}</Text>
          </View>

          <View className="mt-8 px-4">
            <View className="bg-[#1A2432] rounded-lg p-4 mb-4">
              <Text className="text-white font-bold mb-2">Profile Information</Text>
              <View className="space-y-6">
                {/* Profile fields... */}
                <View className="flex-row items-center space-x-2">
                  <User size={18} color="#9EDD45" />
                  <View>
                    <Text className="text-gray-400 text-sm">Full Name</Text>
                    <Text className="text-white">{fullName || 'N/A'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center space-x-2">
                  <Mail size={18} color="#9EDD45" />
                  <View>
                    <Text className="text-gray-400 text-sm">Email</Text>
                    <Text className="text-white">{profileData.email || 'N/A'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center space-x-2">
                  <Phone size={18} color="#9EDD45" />
                  <View>
                    <Text className="text-gray-400 text-sm">Phone Number</Text>
                    <Text className="text-white">{profileData.phone || 'N/A'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center space-x-2">
                  <MapPin size={18} color="#9EDD45" />
                  <View>
                    <Text className="text-gray-400 text-sm">Address</Text>
                    <Text className="text-white">{profileData.address || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className='bg-red-500 flex-row items-center py-1 px-3 rounded-lg' 
                onPress={startDeleteCountdown}
                disabled={isDeletingProfile}
              >
                {isDeletingProfile ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className='text-white text-xl mr-2'>Delete Account</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity className='bg-[#9EDD45] flex-row items-center py-1 px-3 rounded-lg' onPress={() => router.push('/profile/edit-profile')}>
                <Text className='text-[#1A2432] text-xl mr-2'>Edit</Text>
                <Edit3Icon color="#1A2432" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Custom Delete Confirmation Modal - Now properly centered */}
      {showDeleteModal && (
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center">
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50" />
          <View className="bg-[#1A2432] p-6 rounded-lg w-5/6 mx-4">
            <Text className="text-white text-lg font-bold mb-4">Delete Account</Text>
            <Text className="text-gray-300 mb-6">
              {isDeleteEnabled 
                ? "Are you sure you want to permanently delete your account? This action cannot be undone."
                : `For security reasons, the delete option will be available in ${deleteCountdown} seconds.`
              }
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity 
                className="px-4 py-2 rounded"
                onPress={cancelDelete}
              >
                <Text className="text-gray-300">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-2 rounded ${isDeleteEnabled ? 'bg-[#9EDD45]' : 'bg-gray-500'}`}
                onPress={confirmDelete}
                disabled={!isDeleteEnabled}
              >
                <Text className={`${isDeleteEnabled ? 'text-white' : 'text-gray-300'}`}>
                  {isDeleteEnabled ? 'Delete' : `${deleteCountdown}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}