import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ChevronLeft, Clock, Lock, Check, Phone } from "lucide-react-native";
import {
  useGetTimeslotQuery,
  useMakeAppointmentMutation,
} from "@/redux/api/providersApiSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar } from "react-native-calendars";
import { RefreshControl } from "react-native";

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { id, profile } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const userProfile = useMemo(() => {
    return profile ? JSON.parse(profile as string) : {};
  }, [profile]);

  // Separate queries for days and time slots
  const {
    data: daysData,
    refetch: refetchDays,
    isFetching: isFetchingDays,
  } = useGetTimeslotQuery({ id: Number(id) });

  const {
    data: slotsData,
    refetch: refetchSlots,
    isFetching: isFetchingSlots,
  } = useGetTimeslotQuery(
    { day: selectedDate, id: Number(id) },
    { skip: !selectedDate }
  );

  const [makeAppointment, { isLoading: isMaking }] =
    useMakeAppointmentMutation();

  // Extract available days from the API response
  const availableDays = useMemo(() => {
    if (!daysData?.body || !Array.isArray(daysData.body)) return {};

    const marked = {};
    daysData.body.forEach((day) => {
      marked[day.day] = {
        selected: selectedDate === day.day,
        selectedColor: "#7C3AED",
        marked: true,
        dotColor: "#10B981", // Green dot for available days
      };
    });

    // Disable all dates not in the available days
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    let currentDate = new Date(today);
    while (currentDate <= nextYear) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (!marked[dateStr]) {
        marked[dateStr] = { disabled: true, disableTouchEvent: true };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return marked;
  }, [daysData, selectedDate]);

  // Handle day selection
  const handleDaySelect = (day: any) => {
    if (day.disabled) return; // Don't allow selection of disabled dates
    setSelectedDate(day.dateString);
    setSelectedTimeSlot(null); // Reset selected time slot when changing date
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: any) => {
    if (slot.locked) return; // Don't allow selection of booked slots
    setSelectedTimeSlot(slot);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    try {
      if (!selectedTimeSlot) {
        Alert.alert("Error", "Please select a time slot");
        return;
      }

      await makeAppointment({ time_slot_id: selectedTimeSlot.id }).unwrap();
      Alert.alert("Success", "Appointment booked successfully!");
      setShowConfirmationModal(false);
      refetchSlots(); // Refresh the slots after booking
    } catch (error) {
      Alert.alert(
        "Error",
        error?.data?.message || "Failed to book appointment"
      );
      console.error(error);
    }
  };

  // Render time slots for the selected day
  const renderTimeSlots = () => {
    if (!selectedDate || !slotsData?.body || slotsData.body.length === 0) {
      return (
        <View className="bg-lightbackground rounded-lg p-4 items-center justify-center">
          <Text className="text-white">
            {selectedDate
              ? "No available time slots for this day"
              : "Select a date to view available time slots"}
          </Text>
        </View>
      );
    }

    return (
      <View className="bg-lightbackground rounded-lg p-4">
        <Text className="text-white text-lg font-bold mb-3">
          Available Time Slots for {selectedDate}
        </Text>
        <View className="flex-row flex-wrap">
          {slotsData.body.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              className={`p-3 rounded-lg m-1 ${
                slot.locked
                  ? "bg-rose-900/50"
                  : slot.id === selectedTimeSlot?.id
                  ? "bg-primary"
                  : "bg-[#3A3A50]"
              }`}
              onPress={() => handleTimeSlotSelect(slot)}
              disabled={slot.locked}
            >
              <View className="flex-row items-center">
                {slot.locked ? (
                  <Lock size={16} color="#EF4444" className="mr-1" />
                ) : (
                  <Clock size={16} color="#10B981" className="mr-1" />
                )}
                <Text
                  className={`${slot.locked ? "text-rose-400" : "text-white"}`}
                >
                  {slot.startTime} - {slot.endTime}
                </Text>
                {slot.locked && (
                  <Text className="text-rose-400 text-xs ml-2">(Booked)</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Book Button - Only show when time slot is selected */}
        {selectedTimeSlot && (
          <TouchableOpacity
            className="bg-primary rounded-full py-3 items-center justify-center mt-4 shadow-md"
            onPress={() => setShowConfirmationModal(true)}
            disabled={isMaking}
          >
            <Text className="text-white text-lg font-bold">
              {isMaking ? "Processing..." : "Book Appointment"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleRefetch = () => {
    refetchDays();
    if (selectedDate) {
      refetchSlots();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center px-4 pb-4">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Book Appointment
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetchingDays || isFetchingSlots}
            onRefresh={handleRefetch}
          />
        }
        className="flex-1 px-4"
      >
        {/* Date Selection */}
        <View className="bg-lightbackground rounded-lg mb-4">
          <View className="bg-lightbackground rounded-lg p-4">
            <Text className="text-white text-lg font-bold mb-2">
              Select Date
            </Text>
            <Calendar
              onDayPress={handleDaySelect}
              markedDates={availableDays}
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                backgroundColor: "#020E1E",
                calendarBackground: "#020E1E",
                textSectionTitleColor: "#FFFFFF",
                selectedDayBackgroundColor: "#9EDD45",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#9EDD45",
                dayTextColor: "#FFFFFF",
                textDisabledColor: "#3A3A50",
                arrowColor: "#FFFFFF",
                monthTextColor: "#FFFFFF",
                dotColor: "#10B981",
                disabledArrowColor: "#3A3A50",
              }}
            />
          </View>
        </View>

        {/* Time Slots */}
        {renderTimeSlots()}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-lightbackground rounded-lg p-6 w-11/12">
            <Text className="text-white text-xl font-bold mb-4 text-center">
              Confirm Booking
            </Text>

            <View className="mb-4">
              <Text className="text-gray-400">Service:</Text>
              <Text className="text-white text-lg">
                {selectedTimeSlot?.service_id || "N/A"}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400">Date:</Text>
              <Text className="text-white text-lg">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400">Time:</Text>
              <Text className="text-white text-lg">
                {selectedTimeSlot
                  ? `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime}`
                  : "N/A"}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-400">Duration:</Text>
              <Text className="text-white text-lg">
                {selectedTimeSlot &&
                selectedTimeSlot.startTime &&
                selectedTimeSlot.endTime
                  ? `${(
                      Math.abs(
                        new Date(
                          `2000-01-01T${selectedTimeSlot.endTime}`
                        ).getTime() -
                          new Date(
                            `2000-01-01T${selectedTimeSlot.startTime}`
                          ).getTime()
                      ) /
                      (1000 * 60 * 60)
                    ).toFixed(2)} hours`
                  : "N/A"}
              </Text>
            </View>

            <View className="border-t border-gray-700 pt-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Phone size={20} color="#9EDD45" className="mr-2" />
                <Text className="text-white">{userProfile.phone}</Text>
              </View>
              <Text className="text-white">{userProfile.email}</Text>
            </View>

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-gray-600 rounded-lg px-6 py-3"
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text className="text-white">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-primary rounded-lg px-6 py-3"
                onPress={handleConfirmBooking}
                disabled={isMaking}
              >
                <Text className="text-white font-bold">
                  {isMaking ? "Confirming..." : "Confirm Session"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
