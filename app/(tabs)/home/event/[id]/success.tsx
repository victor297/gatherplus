import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

const emojis = ['😞', '😕', '😐', '😊', '😎'];

export default function SuccessScreen() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="items-center mt-8">
        <CheckCircle size={64} color="#9EDD45" />
        <Text className="text-white text-2xl font-bold mt-4">Successfull</Text>
        <Text className="text-gray-400 text-center mt-2">
          Check your email for receipt
        </Text>
      </View>

      <View className="mt-12">
        <Text className="text-white text-xl font-semibold text-center mb-4">
          How was your experience?
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          Your input is valuable in helping us better understand
          your needs and tailor our service accordingly.
        </Text>

        <View className="flex-row justify-between mb-8">
          {emojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedEmoji(index)}
              className={`p-2 rounded-full ${selectedEmoji === index ? 'bg-primary/20' : ''}`}
            >
              <Text className="text-2xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-[#1A2432] rounded-lg p-4 mb-8">
          <TextInput
            className="text-white"
            placeholder="Tell us about your experience"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-4 mb-4"
          onPress={() => {}}
        >
          <Text className="text-background text-center font-semibold">
            Send Feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#1A2432] rounded-lg py-4"
          onPress={() => router.push('/(tabs)')}
        >
          <Text className="text-white text-center font-semibold">
            Dismiss
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}