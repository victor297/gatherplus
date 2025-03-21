import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Upload } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';

export default function BannerScreen() {
  const router = useRouter();
  const params:any = useLocalSearchParams();
  console.log('Params:', params);
  const [courseData,setCourseData] = useState(() => {
    try {
      return params.courseData ? JSON.parse(params.courseData) : null;
    } catch (error) {
      console.error('Error parsing courseData:', error);
      return null;
    }
  });
  console.log(courseData)

  // ✅ Parse formData & sessions correctly
  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error('Error parsing formData:', error);
      return {};
    }
  });

  const [sessions, setSessions] = useState(() => {
    try {
      return params.sessions ? JSON.parse(params.sessions as string) : [];
    } catch (error) {
      console.error('Error parsing sessions:', error);
      return [];
    }
  });
  console.log(formData,sessions)

  // ✅ Maintain uploaded image state
  const [selectedImage, setSelectedImage] = useState<string | null>(formData.bannerImage || null);
  const [loading, setLoading] = useState(false);

  // ✅ Handle Image Upload
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
    } as any); // ✅ Make sure the key is "files"
  
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
        setSelectedImage(uploadedUrl);
  
        // ✅ Update formData with new image URL
        setCourseData((prevData:any) => ({
          ...prevData,
          images: [...(prevData.images || []), uploadedUrl],
        }));
  
        if (courseData) {
          courseData.images = [...(courseData.images || []), uploadedUrl]; // Update courseData directly
        }
      } else {
        Alert.alert('Upload Failed', 'Could not upload the image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };
  

  // ✅ Pass updated formData when navigating
  const handleSaveAndContinue = () => {
    router.push({
      pathname: '/create/ticketing',
      params: {
        formData: JSON.stringify(courseData), // Ensure updated image URL is included
      },
    });
  };

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
          Event Title <Text className="text-red-500">*</Text>
        </Text>

        <TouchableOpacity
          onPress={handleImageUpload}
          className="bg-[#1A2432] rounded-lg p-8 items-center justify-center border-2 border-dashed border-gray-600"
        >
          {loading ? (
            <ActivityIndicator size="large" color="#6B7280" />
          ) : selectedImage ? (
            <Image source={{ uri: selectedImage }} className="w-full h-48 rounded-lg" resizeMode="cover" />
          ) : (
            <>
              <Upload size={48} color="#6B7280" />
              <Text className="text-gray-400 mt-4">No file chosen</Text>
              <TouchableOpacity className="bg-primary px-6 py-2 rounded-lg mt-4">
                <Text className="text-background font-semibold">Upload</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-sm mt-2">
          Feature Image must be at least 1170 pixels wide by 504 pixels high. Valid file formats: JPG, GIF, PNG.
        </Text>
      </View>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity className="bg-primary rounded-lg py-4" onPress={handleSaveAndContinue}>
          <Text className="text-background text-center font-semibold">Save and continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
