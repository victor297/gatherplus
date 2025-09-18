import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  MoreVertical,
  ChevronDown,
  ArrowLeft,
} from "lucide-react-native";
import { useState } from "react";
import { Stack } from "expo-router";
import {
  useGetAppointmentQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
} from "@/redux/api/providersApiSlice";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native";

export default function AppointmentScreen() {
  const router = useRouter();
  const {
    data: appointments,
    isLoading,
    isError,
    refetch,
  } = useGetAppointmentQuery({});
  const [updateAppointment] = useUpdateAppointmentMutation();
  const [cancelAppointment] = useCancelAppointmentMutation();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const statusOptions = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];

  const handleUpdateStatus = async () => {
    try {
      await updateAppointment({
        id: selectedAppointment.id,
        data: {
          status: selectedStatus,
          ...(selectedStatus === "REJECTED" || selectedStatus === "CANCELLED"
            ? { reason: cancelReason }
            : {}),
        },
      }).unwrap();
      refetch();
      setStatusModalVisible(false);
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      await cancelAppointment(selectedAppointment.id).unwrap();
      refetch();
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  const renderAppointmentItem = ({ item }) => {
    const appointmentDate = new Date(item.time_slots.day);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return (
      <TouchableOpacity
        className="bg-lightbackground p-4 mb-2 rounded-lg mx-4"
        onPress={() => {
          setSelectedAppointment(item);
          setModalVisible(true);
        }}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-white font-bold text-lg">
            {item.time_slots.providerService.name}
          </Text>
          <View
            className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}
          >
            <Text className="text-white text-xs">{item.status}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1">
          <User size={16} color="#9EDD45" className="mr-2" />
          <Text className="text-white">{item.customer.profile.name}</Text>
        </View>

        <View className="flex-row items-center mb-1">
          <Calendar size={16} color="#9EDD45" className="mr-2" />
          <Text className="text-white">{formattedDate}</Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={16} color="#9EDD45" className="mr-2" />
          <Text className="text-white">
            {item.time_slots.startTime} - {item.time_slots.endTime}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#9EDD45" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-white">Error loading appointments</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1  bg-background">
      <View className="flex-row items-center px-4  pb-4">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/profile")}
          className="mr-4 bg-[#1A2432] p-2 rounded-full"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Appointments</Text>
      </View>

      <View className="flex-1 bg-background pt-4">
        <FlatList
          data={appointments?.body?.result || []}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-10">
              <Calendar size={48} color="#9EDD45" />
              <Text className="text-white mt-4 text-lg">
                No appointments yet
              </Text>
            </View>
          }
        />
      </View>

      {/* Appointment Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-lightbackground rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                {selectedAppointment?.time_slots.providerService.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#9EDD45" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm">Customer</Text>
              <Text className="text-white">
                {selectedAppointment?.customer.profile.name}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm">Date & Time</Text>
              <Text className="text-white">
                {selectedAppointment &&
                  new Date(
                    selectedAppointment.time_slots.day
                  ).toLocaleDateString()}{" "}
                • {selectedAppointment?.time_slots.startTime} -{" "}
                {selectedAppointment?.time_slots.endTime}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm">Service</Text>
              <Text className="text-white">
                {selectedAppointment?.time_slots.providerService.name}
              </Text>
              <Text className="text-white">
                {selectedAppointment?.time_slots.providerService.price}{" "}
                {selectedAppointment?.time_slots.providerService.currency}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-400 text-sm">Status</Text>
              <View className="flex-row items-center">
                <View
                  className={`px-2 py-1 rounded-full ${
                    selectedAppointment &&
                    getStatusColor(selectedAppointment.status)
                  } mr-2`}
                >
                  <Text className="text-white text-xs">
                    {selectedAppointment?.status}
                  </Text>
                </View>
                {selectedAppointment?.status === "CANCELLED" &&
                  selectedAppointment?.reason && (
                    <Text className="text-gray-400 text-xs">
                      Reason: {selectedAppointment.reason}
                    </Text>
                  )}
              </View>
            </View>

            <View className="flex-row justify-between space-x-3">
              <TouchableOpacity
                className="bg-red-500 py-3 px-4 rounded-lg flex-1 items-center"
                onPress={handleCancelAppointment}
              >
                <Text className="text-white">Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-primary py-3 px-4 rounded-lg flex-1 items-center"
                onPress={() => {
                  setStatusModalVisible(true);
                  setModalVisible(false);
                  setSelectedStatus(selectedAppointment?.status || "PENDING");
                }}
              >
                <Text className="text-background">Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-lightbackground rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Update Status
              </Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <X size={24} color="#9EDD45" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Select Status</Text>
              <View className="border border-gray-600 rounded-lg p-3">
                <TouchableOpacity
                  className="flex-row justify-between items-center"
                  onPress={() =>
                    setSelectedStatus((prev) =>
                      prev === "PENDING" ? "" : "PENDING"
                    )
                  }
                >
                  <Text
                    className={`${
                      selectedStatus === "PENDING"
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    Pending
                  </Text>
                  {selectedStatus === "PENDING" && (
                    <Check size={20} color="#9EDD45" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="border border-gray-600 rounded-lg p-3 mt-2">
                <TouchableOpacity
                  className="flex-row justify-between items-center"
                  onPress={() =>
                    setSelectedStatus((prev) =>
                      prev === "ACCEPTED" ? "" : "ACCEPTED"
                    )
                  }
                >
                  <Text
                    className={`${
                      selectedStatus === "ACCEPTED"
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    Accepted
                  </Text>
                  {selectedStatus === "ACCEPTED" && (
                    <Check size={20} color="#9EDD45" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="border border-gray-600 rounded-lg p-3 mt-2">
                <TouchableOpacity
                  className="flex-row justify-between items-center"
                  onPress={() =>
                    setSelectedStatus((prev) =>
                      prev === "REJECTED" ? "" : "REJECTED"
                    )
                  }
                >
                  <Text
                    className={`${
                      selectedStatus === "REJECTED"
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    Rejected
                  </Text>
                  {selectedStatus === "REJECTED" && (
                    <Check size={20} color="#9EDD45" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {(selectedStatus === "REJECTED" ||
              selectedStatus === "CANCELLED") && (
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Reason</Text>
                <TextInput
                  className="bg-background text-white p-3 rounded-lg"
                  placeholder="Enter reason..."
                  placeholderTextColor="#6B7280"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />
              </View>
            )}

            <TouchableOpacity
              className="bg-primary py-3 px-4 rounded-lg items-center"
              onPress={handleUpdateStatus}
              disabled={!selectedStatus}
            >
              <Text className="text-background">Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
