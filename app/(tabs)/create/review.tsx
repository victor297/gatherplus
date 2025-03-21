import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Ticket } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';
import { useCreateventMutation } from '@/redux/api/eventsApiSlice';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [createvent, { isLoading, error }] = useCreateventMutation(); // Correct destructuring

  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error('Error parsing formData:', error);
      return {};
    }
  });
  console.log(formData,"hhhhhhh")

  const handleSubmit = async () => {
    try {
      const res = await createvent(formData).unwrap();
      console.log(res,"res")

      router.push('/success'); // Navigate on success
    } catch (error) {
      console.error('Event creation failed:', error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Create Event</Text>
      </View>

      <ProgressSteps currentStep={3} />

      {/* Content */}
      <ScrollView className="flex-1">
        <Image
          source={{ uri: formData?.images?.[0] || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3' }}
          className="w-full h-48"
          resizeMode="cover"
        />

        <View className="p-4">
          {/* Event Category */}
          {formData?.eventCategory && (
            <Text className="text-white bg-[#1A2432] px-3 py-1 rounded-full mb-2">
              {formData.eventCategory}
            </Text>
          )}

          {/* Event Details */}
          <Text className="text-white text-2xl font-bold mb-2">{formData?.title || 'Event Title'}</Text>
          <Text className="text-gray-400 mb-4">{formData?.address || 'Event Venue'}</Text>

          {/* About Event */}
          <Text className="text-white text-xl font-semibold mb-4">About Event</Text>
          <Text className="text-gray-400 mb-6">{formData?.description || 'Event Description'}</Text>

          {/* Location */}
          <Text className="text-white text-xl font-semibold mb-4">Location</Text>
          <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
            <Text className="text-white mb-2">{formData?.address || 'Venue Name'}</Text>
            <Text className="text-gray-400">{formData?.city || 'City'}, {formData?.country_code || 'Country'}</Text>
            <View className="w-full h-32 bg-gray-700 rounded-lg my-4" />
            <TouchableOpacity>
              <Text className="text-primary">View map</Text>
            </TouchableOpacity>
          </View>

          {/* Date and Time */}
          <Text className="text-white text-xl font-semibold mb-4">Date and Time</Text>
          {formData?.sessions && formData.sessions.length > 0 ? (
            formData.sessions.map((session: any, index: any) => (
              <View key={index} className="bg-[#1A2432] rounded-lg p-4 mb-2">
                <Text className="text-white mb-2">{session.name}</Text>
                <View className="flex-row items-center mb-2">
                  <Calendar size={20} color="#6B7280" className="mr-2" />
                  <Text className="text-gray-400">{session.date}</Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={20} color="#6B7280" className="mr-2" />
                  <Text className="text-gray-400">{session.start_time} - {session.end_time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 mb-2">No sessions available</Text>
          )}

          {/* Ticket Information */}
          <Text className="text-white text-xl font-semibold mt-6 mb-4">Ticket Information</Text>
          {formData?.tickets && formData.tickets.length > 0 ? (
            formData.tickets.map((ticket: any, index: any) => (
              <View key={index} className="flex-row items-center justify-between bg-[#1A2432] p-4 rounded-lg">
                <View className="flex-row items-center">
                  <Ticket size={20} color="#6B7280" className="mr-3" />
                  <Text className="text-white">{ticket.name} ({ticket.seat_type})</Text>
                </View>
                <Text className="text-primary">₦ {ticket.price} each</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400">No tickets available</Text>
          )}
        </View>
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View className="p-4">
          <Text className="text-red-500 text-center">{(error as any)?.data?.message || 'Failed to create event'}</Text>
        </View>
      )}

      {/* Save & Continue Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity 
          className={`rounded-lg py-4 ${isLoading ? 'bg-gray-500' : 'bg-primary'}`} 
          onPress={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-background text-center font-semibold">Save and continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
