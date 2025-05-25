import React from "react";
import { View, Text } from "react-native";

interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = ["Edit", "Banner", "Ticketing", "Review"];

  return (
    <View className="px-4 py-1">
      <View className="flex-row ">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View className="items-center">
              <View
                className={`w-7 h-7 rounded-full ${
                  index <= currentStep ? "bg-primary" : "bg-gray-600"
                }`}
              />
              <Text
                className={` mt-2 ${
                  index <= currentStep ? "text-primary" : "text-gray-600"
                }`}
              >
                {step}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                className={`flex-1 h-[2px] mt-3  ${
                  index < currentStep ? "bg-primary" : "bg-gray-600"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
