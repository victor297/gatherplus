import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback } from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";

const SuccessFeedbackScreen = () => {
  const [rating, setRating] = useState(3); // Default rating (1-5)
  const [feedback, setFeedback] = useState("");
  const router= useRouter()

  const emojiIcons = ["😡", "😤", "😐", "😊", "😎"];

  const handleSendFeedback = () => {
    alert("Feedback Submitted! Thank you!");
  };
  const handleDismiss = () => {
router.replace("/(tabs)/home/home1")  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-gray-900 items-center p-5">
        {/* Success Icon */}
        <View className="items-center  mt-20">
        <CheckCircle size={64} color="#9EDD45" />
        <Text className="text-white text-2xl font-bold mt-4">Successfull</Text>
        <Text className="text-gray-400 text-center mt-2">
          Check your email for receipt
        </Text>
      </View>

        {/* Feedback Card */}
        <View className="w-full bg-gray-800 rounded-2xl p-5 mt-10">
          <Text className="text-white text-lg font-bold text-center">How was your experience?</Text>
          <Text className="text-gray-400 text-xs text-center mt-1 mb-4">
          Your input is valuable in helping us better understand your needs and tailor our service accordingly.           </Text>

          {/* Emoji Rating */}
          <View className="flex-row justify-between w-full mb-3">
  {emojiIcons.map((emoji, index) => (
    <View key={index} className="items-center">
      <Text
        style={{ fontSize: 30, color: rating === index + 1 ? "white" : "gray" }}
      >
        {emoji}
      </Text>
    </View>
  ))}
</View>


<Slider
  style={{ width: "100%", marginBottom: 15 }}
  minimumValue={1}
  maximumValue={5}
  step={1}
  value={rating}
  minimumTrackTintColor={rating > 0 ? "green" : "gray"}
  maximumTrackTintColor="gray"
  thumbTintColor="white"
  onValueChange={setRating}
/>


          {/* Feedback Input */}
          <Text className="text-white mb-2">Tell us about your experience</Text>
          <TextInput
            className="w-full h-24 bg-gray-700 rounded-lg px-4 text-white mb-4"
            placeholder="Type something here..."
            placeholderTextColor="#ccc"
            value={feedback}
            onChangeText={setFeedback}
            enablesReturnKeyAutomatically
            multiline
          />

          {/* Buttons */}
          <TouchableOpacity className="bg-green-500 w-full py-3 rounded-lg items-center" onPress={handleSendFeedback}>
            <Text className="text-black font-bold text-base">Send Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDismiss} className="border border-gray-500 w-full py-3 rounded-lg items-center mt-3">
            <Text className="text-gray-400 text-base" >Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SuccessFeedbackScreen;
