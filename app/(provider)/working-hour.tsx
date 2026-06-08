import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import {
  ChevronDown,
  Check,
  X,
  ChevronLeft,
  Trash2,
} from "lucide-react-native";
import {
  useCreateworkinghoursMutation,
  useDeleteworkinghourMutation,
} from "@/redux/api/providersApiSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type DayHours = {
  open: string;
  close: string;
};

type WorkingDay = {
  day: string;
  open: string;
  close: string;
  id?: string;
  providerId?: number;
  deleted?: boolean;
  isActive?: boolean;
};

export default function WorkingHoursScreen() {
  const router = useRouter();
  const { workingHours } = useLocalSearchParams();

  const [workinghours, { isLoading }] = useCreateworkinghoursMutation();
  const [deleteworkinghours, { isLoading: isDeleting }] =
    useDeleteworkinghourMutation();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [useSameHours, setUseSameHours] = useState(false);
  const [defaultHours, setDefaultHours] = useState<DayHours>({
    open: "08:00",
    close: "17:00",
  });
  const [dayHours, setDayHours] = useState<Record<string, DayHours>>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingField, setEditingField] = useState<"open" | "close">("open");
  const [currentDay, setCurrentDay] = useState<string>("");
  const [timePickerMode, setTimePickerMode] = useState<"time" | "date">("time");
  const [timePickerValue, setTimePickerValue] = useState(new Date());
  const [existingHours, setExistingHours] = useState<WorkingDay[]>([]);

  const initialworkingHours = useMemo(() => {
    return workingHours ? JSON.parse(workingHours as string) : [];
  }, [workingHours]);

  // Initialize with existing working hours
  useEffect(() => {
    if (initialworkingHours && initialworkingHours.length > 0) {
      setExistingHours(initialworkingHours);

      // Set selected days
      const days = initialworkingHours.map((wh: WorkingDay) => wh.day);
      setSelectedDays(days);

      // Set day hours
      const hoursMap: Record<string, DayHours> = {};
      initialworkingHours.forEach((wh: WorkingDay) => {
        hoursMap[wh.day] = { open: wh.open, close: wh.close };
      });
      setDayHours(hoursMap);

      // Set default hours to the most common hours if using same hours
      if (initialworkingHours.length > 0) {
        const hoursCount: Record<string, number> = {};
        initialworkingHours.forEach((wh: WorkingDay) => {
          const key = `${wh.open}-${wh.close}`;
          hoursCount[key] = (hoursCount[key] || 0) + 1;
        });

        const mostCommon = Object.entries(hoursCount).sort(
          (a, b) => b[1] - a[1]
        )[0][0];
        const [open, close] = mostCommon.split("-");
        setDefaultHours({ open, close });
      }
    }
  }, [initialworkingHours]);

  const toggleDaySelection = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

    // Initialize hours for the day if not already set
    if (!dayHours[day]) {
      setDayHours((prev) => ({
        ...prev,
        [day]: { ...defaultHours },
      }));
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;

      if (useSameHours) {
        setDefaultHours((prev) => ({ ...prev, [editingField]: newTime }));

        // Update all selected days if using same hours
        const updatedDayHours = { ...dayHours };
        selectedDays.forEach((day) => {
          updatedDayHours[day] = {
            ...updatedDayHours[day],
            [editingField]: newTime,
          };
        });
        setDayHours(updatedDayHours);
      } else if (currentDay) {
        setDayHours((prev) => ({
          ...prev,
          [currentDay]: { ...prev[currentDay], [editingField]: newTime },
        }));
      }
    }
  };

  const openTimePicker = (field: "open" | "close", day?: string) => {
    setEditingField(field);
    setCurrentDay(day || "");

    // Set initial time for picker
    let timeStr = "";
    if (useSameHours) {
      timeStr = defaultHours[field];
    } else if (day && dayHours[day]) {
      timeStr = dayHours[day][field];
    } else {
      timeStr = defaultHours[field];
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setTimePickerValue(date);

    setTimePickerMode("time");
    setShowTimePicker(true);
  };

  const getHoursForDay = (day: string) => {
    if (useSameHours) return defaultHours;
    return dayHours[day] || defaultHours;
  };

  const handleDeleteHour = async (day: string) => {
    console.log(day);
    try {
      // Find the existing hour to get the ID
      const hourToDelete = existingHours.find((wh) => wh.day === day);
      console.log(hourToDelete.id);
      if (hourToDelete?.id) {
        Alert.alert(
          "Confirm Delete",
          `Are you sure you want to delete working hours for ${day}?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                await deleteworkinghours(hourToDelete.id).unwrap();

                // Update state
                setExistingHours((prev) => prev.filter((wh) => wh.day !== day));
                setSelectedDays((prev) => prev.filter((d) => d !== day));

                // Remove from dayHours
                const updatedDayHours = { ...dayHours };
                delete updatedDayHours[day];
                setDayHours(updatedDayHours);

                Alert.alert("Success", "Working hours deleted successfully!");
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete working hours");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }

    const workingHoursPayload = selectedDays.map((day) => {
      const existing = existingHours.find((wh) => wh.day === day);
      const hours = getHoursForDay(day);

      return {
        ...(existing && { id: existing.id }), // Include ID if it's an existing record
        day,
        open: hours.open,
        close: hours.close,
        providerId: existing?.providerId, // Include providerId if it exists
      };
    });

    try {
      await workinghours({ workingHours: workingHoursPayload }).unwrap();
      Alert.alert("Success", "Working hours saved successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save working hours");
      console.error(error);
    }
  };

  const isExistingHour = (day: string) => {
    return existingHours.some((wh) => wh.day === day);
  };

  const getExistingHourId = (day: string) => {
    return existingHours.find((wh) => wh.day === day)?.id;
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center px-4 pb-4">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Working Hours</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Same Hours Toggle */}
        <View className="flex-row items-center justify-between bg-lightbackground rounded-lg p-4 mb-4">
          <Text className="text-white text-base">
            Use same hours for all days
          </Text>
          <Switch
            trackColor={{ false: "#3A3A50", true: "#9EDD45" }}
            thumbColor={useSameHours ? "#FFFFFF" : "#9CA3AF"}
            value={useSameHours}
            onValueChange={setUseSameHours}
          />
        </View>

        {/* Default Hours */}
        {useSameHours && (
          <View className="bg-lightbackground rounded-lg p-4 mb-6">
            <Text className="text-white text-base font-semibold mb-3">
              Default Hours
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-background rounded-lg p-3 flex-1 mr-2"
                onPress={() => openTimePicker("open")}
              >
                <Text className="text-gray-400 text-sm">Open</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-base">
                    {defaultHours.open}
                  </Text>
                  <ChevronDown size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-background rounded-lg p-3 flex-1 ml-2"
                onPress={() => openTimePicker("close")}
              >
                <Text className="text-gray-400 text-sm">Close</Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-base">
                    {defaultHours.close}
                  </Text>
                  <ChevronDown size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Days Selection */}
        <Text className="text-white text-base font-semibold mb-3">
          {existingHours.length > 0
            ? "Edit Working Days"
            : "Select Working Days"}
        </Text>
        <View className="bg-lightbackground rounded-lg overflow-hidden mb-6">
          {daysOfWeek.map((day, index) => (
            <View
              key={day}
              className={`flex-row items-center justify-between p-4 ${
                index !== daysOfWeek.length - 1
                  ? "border-b border-background"
                  : ""
              }`}
            >
              <Text className="text-white text-base">{day}</Text>
              <View className="flex-row items-center">
                {selectedDays.includes(day) && (
                  <View className="flex-row items-center mr-4">
                    <TouchableOpacity
                      className="bg-background rounded-lg px-3 py-1 mr-2"
                      onPress={() => openTimePicker("open", day)}
                    >
                      <Text className="text-white">
                        {getHoursForDay(day).open}
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-white mx-1">-</Text>
                    <TouchableOpacity
                      className="bg-background rounded-lg px-3 py-1 ml-2"
                      onPress={() => openTimePicker("close", day)}
                    >
                      <Text className="text-white">
                        {getHoursForDay(day).close}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View className="flex-row items-center">
                  {isExistingHour(day) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteHour(day)}
                      className="p-2 mr-2"
                    >
                      <Trash2 size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => toggleDaySelection(day)}
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selectedDays.includes(day)
                        ? "bg-primary border-primary"
                        : "border-primary"
                    }`}
                  >
                    {selectedDays.includes(day) && (
                      <Check size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-full py-4 items-center justify-center mb-6 shadow-md"
          onPress={handleSubmit}
          disabled={isLoading || isDeleting}
        >
          <Text className="text-white text-lg font-bold">
            {isLoading ? "Saving..." : "Save Working Hours"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={timePickerValue}
          mode={timePickerMode}
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
          textColor="#FFFFFF"
          themeVariant="dark"
        />
      )}
    </SafeAreaView>
  );
}
