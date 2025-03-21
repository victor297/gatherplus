import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { useGetProfileQuery, useUpdateProfileMutation } from '@/redux/api/usersApiSlice';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: userProfile, isLoading: isFetchingProfile, refetch } = useGetProfileQuery(null); // Fetch user profile data
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
    image_url: '',
  });

  // Populate fields with user profile data
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstname: userProfile?.body?.firstname || '',
        lastname: userProfile?.body?.lastname || '',
        phone: userProfile?.body?.phone || '',
        address: userProfile?.body?.address || '',
        image_url: userProfile?.body?.image_url || '',
      });
    }
  }, [userProfile]);

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const imageUri = result.assets[0].uri;
    const fileName = imageUri.split('/').pop();
    const fileType = fileName?.split('.').pop() || 'jpg';

    const formDataUpload = new FormData();
    formDataUpload.append('files', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);

    try {
      const response = await fetch('https://gather-plus-backend-core.onrender.com/api/v1/file', {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.code === 200 && data.body?.[0]?.secure_url) {
        setProfileData((prevData) => ({
          ...prevData,
          image_url: data.body[0].secure_url,
        }));
      } else {
        Alert.alert('Upload Failed', 'Could not upload the image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong during upload.');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(profileData).unwrap();
      Alert.alert('Success', 'Profile updated successfully.');
      refetch()
      router.back();
    } catch (error) {
      Alert.alert('Update Failed', 'Could not update profile. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Account Info</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#9EDD45" /> : <Check color="#9EDD45" size={24} />}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {isFetchingProfile ? (
          <ActivityIndicator color="white" size="large" className="mt-10" />
        ) : (
          <>
            <View className="items-center mt-8 mb-8">
              <View className="relative">
                <Image
                  source={{
                    uri: profileData.image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
                  }}
                  className="w-24 h-24 rounded-full"
                />
                <TouchableOpacity
                  onPress={handleImageUpload}
                  className="absolute bottom-0 right-0 bg-primary p-2 rounded-full"
                >
                  <Camera size={20} color="#020E1E" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-white mb-2">
                  First Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                  placeholder="Enter first name"
                  placeholderTextColor="#6B7280"
                  value={profileData.firstname}
                  onChangeText={(text) => setProfileData({ ...profileData, firstname: text })}
                />
              </View>

              <View>
                <Text className="text-white mb-2">
                  Last Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                  placeholder="Enter last name"
                  placeholderTextColor="#6B7280"
                  value={profileData.lastname}
                  onChangeText={(text) => setProfileData({ ...profileData, lastname: text })}
                />
              </View>

              <View>
                <Text className="text-white mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                  placeholder="+1234567890"
                  placeholderTextColor="#6B7280"
                  value={profileData.phone}
                  onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-white mb-2">Address</Text>
                <TextInput
                  className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                  placeholder="Enter your address"
                  placeholderTextColor="#6B7280"
                  value={profileData.address}
                  onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity className="bg-primary rounded-lg py-4" onPress={handleSave} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-background text-center font-semibold">Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
