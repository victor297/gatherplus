import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  EllipsisVerticalIcon,
  UserIcon,
} from "lucide-react-native";
import {
  useDeleteEventMutation,
  useGetEventQuery,
} from "@/redux/api/eventsApiSlice";
import { formatDate } from "@/utils/formatDate";
import { useSelector } from "react-redux";
import MapView, { Marker } from "react-native-maps";

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userInfo } = useSelector((state: any) => state.auth);
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery({ id, user_id: userInfo?.sub });
  const [deleteEvent] = useDeleteEventMutation();

  const [showOptions, setShowOptions] = useState(false);

  const handleDeleteEvent = async () => {
    try {
      const res = await deleteEvent(id).unwrap();
      Alert.alert("Success", "Event deleted successfully");

      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to delete event");
      console.log("Delete event error:", error);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this event?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteEvent,
        },
      ],
      { cancelable: true }
    );
  };

  const handleOptionPress = (option: string) => {
    setShowOptions(false);
    switch (option) {
      case "edit":
        router.push(`/home/event/${id}/update/updatecreate`);
        break;
      case "share":
        Alert.alert("Share", "Share functionality would go here");
        break;
      case "delete":
        confirmDelete();
        break;
    }
  };

  const getTotalSalesAmount = () => {
    return event?.body?.tickets?.reduce((total: any, ticket: any) => {
      return total + ticket.price * ticket.totalSold;
    }, 0);
  };
  const getTotalTicketsSold = () => {
    return event?.body?.tickets?.reduce(
      (total: any, ticket: any) => total + ticket.totalSold,
      0
    );
  };

  const openMaps = () => {
    const address = encodeURIComponent(
      `${event?.body?.address}, ${event?.body?.city}, ${event?.body?.country?.name}`
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <>
      {isLoading ? (
        <View className="text-white flex-1 bg-background flex justify-center items-center py-4">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : error ? (
        <View className="flex-1 bg-background justify-center items-center">
          <Text className="text-red-500">
            Failed to load data. Please try again.
          </Text>
        </View>
      ) : (
        <View className="flex-1 bg-background">
          <ScrollView className="flex-1">
            <View className=" w-full flex-row justify-between items-center p-4 pt-12">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-4 bg-[#1A2432] p-2 rounded-full"
              >
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Modal
                transparent={true}
                visible={showOptions}
                onRequestClose={() => setShowOptions(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowOptions(false)}
                >
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => handleOptionPress("edit")}
                      disabled={Boolean(getTotalTicketsSold())}
                    >
                      {Boolean(getTotalTicketsSold()) ? (
                        <Text style={styles.optionText}>Can't Edit</Text>
                      ) : (
                        <Text style={styles.optionText}>Edit</Text>
                      )}
                    </TouchableOpacity>
                    {/* <TouchableOpacity 
                          style={styles.optionButton}
                          onPress={() => handleOptionPress('share')}
                        >
                          <Text style={styles.optionText}>Share</Text>
                        </TouchableOpacity> */}
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => handleOptionPress("delete")}
                    >
                      <Text style={[styles.optionText, styles.deleteText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
              <Text className="text-white font-semibold text-xl">
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                className="bg-[#1A2432] p-2 rounded-full"
                onPress={() => setShowOptions(!showOptions)}
              >
                <EllipsisVerticalIcon color="white" size={24} />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: event?.body?.images?.[0] }}
              className="w-full h-72 rounded-lg"
              resizeMode="cover"
            />

            <View className="px-4 pt-4">
              <Text className="text-white text-2xl font-bold mb-2">
                {event?.body?.title}
              </Text>
              <View className="flex-row justify-between items-end mb-6">
                <View>
                  <Text className="text-gray-400">
                    {event?.body?.address || "Downtown Jazz Club"}
                  </Text>
                  <Text className="text-white">
                    {formatDate(event?.body?.start_date || "2025-12-24")}
                  </Text>
                </View>

                <View className="flex-row items-center bg-[#9edd45]/20 rounded-xl px-3 py-1">
                  <UserIcon color="#9edd45" size={18} />
                  <Text className="text-[#9edd45] font-semibold ml-2 text-sm">
                    {getTotalTicketsSold().toLocaleString()} Participants
                  </Text>
                </View>
              </View>

              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  About Event
                </Text>
                <Text className="text-gray-400 mb-6">
                  {event?.body?.description}
                </Text>
              </View>
              <View className="bg-[#1A2432] rounded-lg p-4 mb-6">
                <Text className="text-white text-xl font-semibold mb-4">
                  Location
                </Text>
                <Text className="text-white mb-2">{event?.body?.address}</Text>
                <Text className="text-gray-400 mb-4 ">
                  {event?.body?.country?.name}, {event?.body?.state?.name},{" "}
                  {event?.body?.city}
                </Text>
                <View className="w-full h-40 bg-gray-700 rounded-lg my-3 overflow-hidden">
                  <MapView
                    style={{ flex: 1 }}
                    initialRegion={{
                      latitude: 51.5074, // Default to London coordinates
                      longitude: -0.1278,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: 51.5074, longitude: -0.1278 }}
                      title={event?.body?.address}
                      description={event?.body?.city}
                    />
                  </MapView>
                </View>
                <TouchableOpacity onPress={openMaps} className="self-end">
                  <Text className="text-primary">View map</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-white text-xl font-semibold mb-4">
                  Date and Time
                </Text>
                <View className="flex-row mb-6">
                  <View className="flex-col gap-2">
                    <View className="flex-row items-center mr-6">
                      <Calendar className="text-gray-400 mr-2" size={20} />
                      <Text className="text-gray-400">
                        {formatDate(event?.body?.start_date)}
                      </Text>
                    </View>
                    {event?.body?.sessions?.map((session: any, index: any) => (
                      <View key={index} className="flex-row items-center">
                        <Clock className="text-gray-400 mr-2" size={20} />
                        <Text className="text-gray-400">
                          {session?.start_time} - {session?.end_time}{" "}
                        </Text>
                        <Text className="text-primary">{`(${
                          session?.name || ""
                        })`}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View className="bg-gray-800 rounded-lg p-4 mb-4">
                <Text className="text-white text-xl font-semibold mb-4">
                  Tickets
                </Text>
                <View className="space-y-2">
                  {event?.body?.tickets?.map((ticket: any, index: any) => (
                    <View key={index} className="flex-row justify-between">
                      <Text className="text-white text-base">
                        {ticket?.name}
                      </Text>
                      <Text className="text-white text-base font-bold">{`${
                        ticket?.totalSold || 0
                      }`}</Text>
                    </View>
                  ))}
                </View>

                <View className="border-t border-gray-600 my-4" />

                <View className="flex-row justify-between mb-2">
                  <Text className="text-white text-base">Sub-total</Text>
                  <Text className="text-white text-base font-bold">
                    {event?.body?.currency?.split(" - ")[0]}
                    {getTotalSalesAmount().toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-4">
                  <Text className="text-white text-base">Tax</Text>
                  <Text className="text-white text-base font-bold">0</Text>
                </View>

                <View className="border-t border-gray-600 my-2" />

                <View className="flex-row justify-between">
                  <Text className="text-white text-xl font-bold">Total</Text>
                  <Text className="text-primary text-xl font-bold">
                    {event?.body?.currency?.split(" - ")[0]}
                    {getTotalSalesAmount().toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="p-4 border-t mb-3 flex flex-row justify-between border-[#1A2432]">
            <TouchableOpacity
              className="border border-gray-500 w-[49%] rounded-lg py-3"
              onPress={() =>
                router.push(`/profile/${event?.body?.id}/myeventbookingdetails`)
              }
            >
              <Text className="text-white text-center  text-xl font-bolsemiboldd">
                View Participants
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border-gray-400 w-[49%]  bg-primary rounded-lg py-3"
              onPress={() => router.back()}
            >
              <Text className="text-background text-center text-xl font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  optionsContainer: {
    backgroundColor: "#1A2432",
    borderRadius: 8,
    padding: 8,
    width: 150,
    position: "absolute",
    right: 20,
    top: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    color: "white",
    fontSize: 16,
  },
  deleteText: {
    color: "red",
  },
});
