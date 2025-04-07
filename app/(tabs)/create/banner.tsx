import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Upload } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';

export default function BannerScreen() {
  const router = useRouter();
  const params: any = useLocalSearchParams();
  
  // Initialize formData with params or empty object
  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error('Error parsing formData:', error);
      return {};
    }
  });

  // Track the uploaded banner image separately
  const [bannerImage, setBannerImage] = useState<string | null>(
    // First check if we have a bannerImage in formData
    formData.bannerImage || 
    // Then check if we have any images in the array
    (formData.images && formData.images.length > 0 ? formData.images[0] : null)
  );

  const [loading, setLoading] = useState(false);

  const handleImageUpload = async () => {
    // If we already have a banner image, confirm if user wants to replace it
    if (bannerImage) {
      Alert.alert(
        'Replace Image?',
        'You already have a banner image. Do you want to replace it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: uploadNewImage }
        ]
      );
      return;
    }
    
    await uploadNewImage();
  };

  const uploadNewImage = async () => {
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
      setLoading(true);
      const response = await fetch('https://gather-plus-backend-core.onrender.com/api/v1/file', {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      const data = await response.json();
  
      if (data.code === 200 && data.body?.[0]?.secure_url) {
        const uploadedUrl = data.body[0].secure_url;
        setBannerImage(uploadedUrl);
        
        // Update formData with the new banner image
        setFormData((prevData: any) => ({
          ...prevData,
          // Maintain only one image in the array (replace if exists)
          images: [uploadedUrl]
        }));
      } else {
        Alert.alert('Upload Failed', 'Could not upload the image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = () => {
    if (!bannerImage) {
      Alert.alert('Image Required', 'Please upload a banner image');
      return;
    }

    router.push({
      pathname: '/create/ticketing',
      params: {
        formData: JSON.stringify({
          ...formData,
          // Ensure images array contains only our banner image
          images: [bannerImage]
        }),
        sessions: params.sessions || JSON.stringify([]),
      },
    });
  };
  console.log(bannerImage,formData,"bannerImage")

  return (
    <View className="flex-1 bg-background">
    <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Create Event</Text>
      </View>

      <ProgressSteps currentStep={1} />

       
      <View className="flex-1 px-4">
        <Text className="text-white mb-2">
          Event Banner <Text className="text-red-500">*</Text>
        </Text>

        <TouchableOpacity
          onPress={handleImageUpload}
          className="bg-[#1A2432] rounded-lg p-8 items-center justify-center border-2 border-dashed border-gray-600"
        >
          {loading ? (
            <ActivityIndicator size="large" color="#6B7280" />
          ) : bannerImage ? (
            <Image source={{ uri: bannerImage }} className="w-full h-48 rounded-lg" resizeMode="cover" />
          ) : (
            <>
              <Upload size={48} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No file chosen</Text>
              <Text className="text-primary font-semibold mt-2">Choose File</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-sm mt-2">
          Feature Image must be at least 1170px wide by 504px high. JPG, GIF, or PNG.
        </Text>
      </View>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity 
          className={`rounded-lg py-4 ${bannerImage ? 'bg-primary' : 'bg-gray-500'}`} 
          onPress={handleSaveAndContinue}
          disabled={!bannerImage}
        >
          <Text className="text-background text-center font-semibold">Save and continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}