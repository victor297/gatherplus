import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Switch,
  Alert,
  TextInput,
  RefreshControl,
  FlatList,
} from "react-native";
import { ChevronLeft, ChevronDown, Check } from "lucide-react-native";
import {
  useCreateTimeslotMutation,
  useGetTimeslotQuery,
} from "@/redux/api/providersApiSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar } from "react-native-calendars";
import { useSelector } from "react-redux";

export default function CreateTimeslotScreen() {
  const router = useRouter();
  const { userInfo } = useSelector((state: any) => state.auth);
  const { serviceparam } = useLocalSearchParams();
  const services = useMemo(() => {
    return serviceparam ? JSON.parse(serviceparam as string) : [];
  }, [serviceparam]);

  const [timeslot, { isLoading: isCreating }] = useCreateTimeslotMutation();
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | false>(
    false
  );
  const [duration, setDuration] = useState("30");
  const [selectedService, setSelectedService] = useState<number | "all">(
    services.length > 0 ? services[0].id : "all"
  );
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  // Separate queries for days and time slots
  const {
    data: daysData,
    refetch: refetchDays,
    isFetching: isFetchingDays,
  } = useGetTimeslotQuery({ id: selectedService });

  const {
    data: slotsData,
    refetch: refetchSlots,
    isFetching: isFetchingSlots,
  } = useGetTimeslotQuery(
    { day: selectedDate, id: selectedService },
    { skip: !selectedDate }
  );

  // New state for viewing available slots
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [selectedViewDate, setSelectedViewDate] = useState<string>("");

  // Extract days with available slots from the API response
  const availableDays = useMemo(() => {
    if (!daysData?.body || Array.isArray(daysData.body) === false) {
      return {};
    }

    const markedDates: Record<string, any> = {};

    daysData.body.forEach((dayData: any) => {
      markedDates[dayData.day] = {
        marked: true,
        dotColor: "#9EDD45",
        selected: dayData.day === selectedViewDate,
        selectedColor: "#9EDD45",
      };
    });

    return markedDates;
  }, [daysData, selectedViewDate]);

  // Extract time slots for a specific day
  const timeSlotsForDay = useMemo(() => {
    if (!slotsData?.body || Array.isArray(slotsData.body) === false) {
      return [];
    }
    return slotsData.body;
  }, [slotsData]);

  const handleViewDateSelect = (day: any) => {
    setSelectedViewDate(day.dateString);
    setSelectedDate(day.dateString);
  };

  // Rest of your existing code remains the same...
  const handleDateSelect = (day: any) => {
    if (showCalendar === "start") {
      if (dateRange.start === day.dateString) {
        setDateRange((prev) => ({ ...prev, start: "" }));
      } else {
        setDateRange((prev) => ({
          start: day.dateString,
          end: prev.end && day.dateString > prev.end ? "" : prev.end,
        }));
      }
      setSelectedDay(day.dateString);
    } else if (showCalendar === "end") {
      if (dateRange.end === day.dateString) {
        setDateRange((prev) => ({ ...prev, end: "" }));
      } else {
        if (dateRange.start && day.dateString < dateRange.start) {
          Alert.alert("Error", "End date cannot be before start date");
          return;
        }
        setDateRange((prev) => ({ ...prev, end: day.dateString }));
      }
      setSelectedDay(day.dateString);
    }
  };

  const handleSubmit = async () => {
    if (!dateRange.start || !dateRange.end) {
      Alert.alert("Error", "Please select both start and end dates");
      return;
    }

    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes)) {
      Alert.alert("Error", "Please enter a valid duration in minutes");
      return;
    }

    try {
      let payload;

      if (selectedService === "all") {
        payload = services.map((service) => ({
          slot_start: dateRange.start,
          slot_end: dateRange.end,
          service_id: service.id,
          duration: durationMinutes,
        }));
      } else {
        payload = [
          {
            slot_start: dateRange.start,
            slot_end: dateRange.end,
            service_id: selectedService,
            duration: durationMinutes,
          },
        ];
      }

      await timeslot({ slot: payload }).unwrap();
      Alert.alert("Success", "Time slots created successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", error?.data?.body || "Failed to create time slots");
      console.error(error);
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (dateRange.start) {
      marks[dateRange.start] = {
        startingDay: true,
        color: "#9EDD45",
        textColor: "white",
      };
    }

    if (dateRange.end) {
      marks[dateRange.end] = {
        endingDay: true,
        color: "#9EDD45",
        textColor: "white",
      };
    }

    if (dateRange.start && dateRange.end) {
      const rangeMarks = generateDateRange(dateRange.start, dateRange.end);
      Object.assign(marks, rangeMarks);
    }

    if (selectedDay) {
      marks[selectedDay] = {
        ...marks[selectedDay],
        selected: true,
        selectedColor: "#9EDD45",
      };
    }

    return marks;
  }, [dateRange, selectedDay]);

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
          {viewMode === "create" ? "Create Time Slots" : "View Available Slots"}
        </Text>
      </View>

      {/* Toggle between create and view modes */}
      <View className="flex-row justify-around px-4 mb-4">
        <TouchableOpacity
          className={`py-3 px-4  rounded-lg w-[45%] ${
            viewMode === "create"
              ? "bg-primary border-2 border-primary"
              : "bg-lightbackground border-2 border-gray-400 "
          }`}
          onPress={() => setViewMode("create")}
        >
          <Text className="text-white text-center">Create Slots</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-3 px-4 rounded-lg  w-[45%] ${
            viewMode === "view"
              ? "bg-primary border-2 border-primary"
              : "bg-lightbackground border-2 border-gray-400 "
          }`}
          onPress={() => {
            setViewMode("view");
            refetchDays();
          }}
        >
          <Text className="text-white text-center">View Slots</Text>
        </TouchableOpacity>
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
        {viewMode === "create" ? (
          <>
            {/* Your existing create timeslot UI */}
            {/* Service Selection */}
            <View className="bg-lightbackground rounded-lg p-4 mb-4">
              <Text className="text-white text-base font-semibold mb-3">
                Select Service
              </Text>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white">Apply to all services</Text>
                <Switch
                  trackColor={{ false: "#3A3A50", true: "#9EDD45" }}
                  thumbColor={selectedService === "all" ? "#FFFFFF" : "#9CA3AF"}
                  value={selectedService === "all"}
                  onValueChange={(value) =>
                    setSelectedService(value ? "all" : services?.[0]?.id)
                  }
                />
              </View>

              {selectedService !== "all" && (
                <TouchableOpacity
                  className="bg-background rounded-lg p-3"
                  onPress={() => setShowServiceModal(true)}
                >
                  <Text className="text-gray-400 text-sm">Service</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-base">
                      {services?.find((s) => s.id === selectedService)?.name ||
                        "Select service"}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Date Range Selection */}
            <View className="bg-lightbackground rounded-lg p-4 mb-4">
              <Text className="text-white text-base font-semibold mb-3">
                Select Date Range
              </Text>
              <View className="flex-row justify-between mb-2">
                <TouchableOpacity
                  className="bg-background rounded-lg p-3 flex-1 mr-2"
                  onPress={() => setShowCalendar("start")}
                >
                  <Text className="text-gray-400 text-sm">Start Date</Text>
                  <Text className="text-white text-base">
                    {dateRange.start || "Select start date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-background rounded-lg p-3 flex-1 ml-2"
                  onPress={() => {
                    if (!dateRange.start) {
                      Alert.alert("Error", "Please select start date first");
                      return;
                    }
                    setShowCalendar("end");
                  }}
                >
                  <Text className="text-gray-400 text-sm">End Date</Text>
                  <Text className="text-white text-base">
                    {dateRange.end || "Select end date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration Input */}
            <View className="bg-lightbackground rounded-lg p-4 mb-4">
              <Text className="text-white text-base font-semibold mb-3">
                Slot Duration (minutes)
              </Text>
              <TextInput
                className="bg-background text-white rounded-lg p-3"
                placeholder="Enter duration in minutes"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-primary rounded-full py-4 items-center justify-center mb-6 shadow-md"
              onPress={handleSubmit}
              disabled={isCreating || !dateRange.start || !dateRange.end}
            >
              <Text className="text-white text-lg font-bold">
                {isCreating ? "Saving..." : "Create Time Slots"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* View Available Slots UI */}
            <View className="bg-lightbackground rounded-lg p-4 mb-4">
              <Text className="text-white text-base font-semibold mb-3">
                Select Service
              </Text>

              <TouchableOpacity
                className="bg-background rounded-lg p-2"
                onPress={() => setShowServiceModal(true)}
              >
                <Text className="text-gray-400 text-sm">Service</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-base">
                    {services?.find((s) => s.id === selectedService)?.name ||
                      "Select service"}
                  </Text>
                  <ChevronDown size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Calendar to view available slots */}
            <View className="bg-lightbackground rounded-lg p-4 mb-4">
              <Text className="text-white text-base font-semibold mb-3">
                Available Time Slots
              </Text>
              <Calendar
                onDayPress={handleViewDateSelect}
                markedDates={availableDays}
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
                }}
              />
            </View>

            {/* Display time slots for selected day */}
            {selectedViewDate && (
              <View className="bg-lightbackground rounded-lg p-4 mb-4">
                <Text className="text-white text-base font-semibold mb-3">
                  Time Slots for {selectedViewDate}
                </Text>
                {timeSlotsForDay.length > 0 ? (
                  <FlatList
                    data={timeSlotsForDay}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View
                        className={`p-3 mb-2 rounded-lg ${
                          item.locked ? "bg-red-900/50" : "bg-background"
                        }`}
                      >
                        <Text className="text-white">
                          {item.startTime} - {item.endTime}
                        </Text>
                        {item.locked && (
                          <Text className="text-red-400 text-sm mt-1">
                            Booked
                          </Text>
                        )}
                      </View>
                    )}
                  />
                ) : (
                  <Text className="text-gray-400">
                    No time slots available for this day
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Calendar Modal */}
        <Modal
          visible={!!showCalendar}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-lightbackground rounded-lg p-4 w-11/12">
              <Text className="text-white text-lg font-bold mb-2">
                {showCalendar === "start"
                  ? "Select Start Date"
                  : "Select End Date"}
              </Text>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                minDate={showCalendar === "end" ? dateRange.start : undefined}
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
                }}
              />
              <TouchableOpacity
                className="bg-primary rounded-lg p-3 mt-4 items-center"
                onPress={() => setShowCalendar(false)}
              >
                <Text className="text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Service Selection Modal */}
        <Modal
          visible={showServiceModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowServiceModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-lightbackground rounded-lg p-4 w-11/12 max-h-[80%]">
              <Text className="text-white text-lg font-bold mb-4">
                Select Service
              </Text>
              <ScrollView>
                {services?.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    className="p-3 flex-row items-center justify-between"
                    onPress={() => {
                      setSelectedService(service.id);
                      setShowServiceModal(false);
                      refetchDays();
                      if (selectedDate) {
                        refetchSlots();
                      }
                    }}
                  >
                    <Text className="text-white">{service.name}</Text>
                    {selectedService === service.id && (
                      <Check size={20} color="#9EDD45" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                className="bg-primary rounded-lg p-3 mt-4 items-center"
                onPress={() => setShowServiceModal(false)}
              >
                <Text className="text-white">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function generateDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const range: Record<string, any> = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    if (dateStr !== start && dateStr !== end) {
      range[dateStr] = { color: "#9EDD45", textColor: "white" };
    }
  }

  return range;
}
