import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react-native';


interface AttendeeDetails {
  fullname: string;
  email: string;
  phone: string;
}

const eventData = {
  id: 10,
  title: "Music Festival 2025",
  description: "An amazing music festival featuring top artists.",
  address: "123 Festival Avenue, New York",
  images: ["https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3"],
  sessions: [
    { id: 17, name: "Opening Ceremony", start_time: "18:00", end_time: "19:00" },
    { id: 18, name: "Main Concert", start_time: "19:30", end_time: "23:00" },
  ],
  tickets: [
    { id: 18, name: "General Admission", price: "50", quantity: 100 },
    { id: 19, name: "VIP", price: "150", quantity: 50 },
  ],
};
export default function CheckoutScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ticketData = JSON.parse(data as string);
  console.log(ticketData,"ticketDataticketData")
  
  const [useCommonDetails, setUseCommonDetails] = useState(!ticketData.each_ticket_identity);
  const [commonDetails, setCommonDetails] = useState<AttendeeDetails>({
    fullname: '',
    email: '',
    phone: ''
  });
  const [attendeeDetails, setAttendeeDetails] = useState<AttendeeDetails[]>(
    Array(ticketData.ticketInstances.length).fill({
      fullname: '',
      email: '',
      phone: ''
    })
  );

  const handleContinue = () => {
    // Prepare data for backend
    const bookings = useCommonDetails 
      ? ticketData.ticketInstances.map(instance => ({
          ...commonDetails,
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name:instance.name,
          price:instance.price
        }))
      : ticketData.ticketInstances.map((instance, index) => ({
          ...attendeeDetails[index],
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name:instance.name,
          price:instance.price
        }));

    const bookingData = {
      event_id: Number(ticketData.eventId),
      channel: "PayStack",
      bookings
    };

    console.log('Booking data to be sent:', bookingData);
    router.push({pathname:`/home/event/${ticketData?.eventId}/summary`,    
        params: { data: JSON.stringify(bookingData) }}
  );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Event Details</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        
        <View className="mb-6">
          <TouchableOpacity
            className={`p-4 rounded-lg mb-4 ${useCommonDetails ? 'bg-primary' : 'bg-[#1A2432]'}`}
            // onPress={() => setUseCommonDetails(true)}
          >
            <Text className={useCommonDetails ? 'text-background' : 'text-white'}>
              Use same details for all tickets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg ${!useCommonDetails ? 'bg-primary' : 'bg-[#1A2432]'}`}
            // onPress={() => setUseCommonDetails(false)}
          >
            <Text className={!useCommonDetails ? 'text-background' : 'text-white'}>
              Add individual details for each ticket
            </Text>
          </TouchableOpacity>
        </View>

        {useCommonDetails ? (
          <View className="space-y-4">
            <View>
              <Text className="text-white mb-2">Full Name</Text>
              <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                <User size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  placeholder="Enter full name"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.fullname}
                  onChangeText={(text) => setCommonDetails({...commonDetails, fullname: text})}
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">Email</Text>
              <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                <Mail size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  placeholder="Enter email"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.email}
                  onChangeText={(text) => setCommonDetails({...commonDetails, email: text})}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">Phone</Text>
              <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                <Phone size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white"
                  placeholder="Enter phone number"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.phone}
                  onChangeText={(text) => setCommonDetails({...commonDetails, phone: text})}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        ) : (
          ticketData.ticketInstances.map((instance, index) => (
            <View key={index} className="mb-6">
              <View className="bg-[#4d6382] rounded-lg p-4 mb-4">
                <Text className="text-white">Ticket {index + 1}</Text>
                <Text className="text-gray-400">
                  Session: {ticketData?.event.sessions.find(s => s.id === instance.sessionId)?.name} {ticketData?.event.sessions.find(s => s.id === instance.sessionId)?.start_time} - {ticketData?.event.sessions.find(s => s.id === instance.sessionId)?.end_time}
                </Text>
              </View>
              
              <View className="space-y-4">
                <View>
                  <Text className="text-white mb-2">Full Name</Text>
                  <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                    <User size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white"
                      placeholder="Enter full name"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].fullname}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {...attendeeDetails[index], fullname: text};
                        setAttendeeDetails(newDetails);
                      }}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white mb-2">Email</Text>
                  <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white"
                      placeholder="Enter email"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].email}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {...attendeeDetails[index], email: text};
                        setAttendeeDetails(newDetails);
                      }}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-white mb-2">Phone</Text>
                  <View className="flex-row items-center bg-[#1A2432] rounded-lg px-4 py-3">
                    <Phone size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white"
                      placeholder="Enter phone number"
                      placeholderTextColor="#6B7280"
                      value={attendeeDetails[index].phone}
                      onChangeText={(text) => {
                        const newDetails = [...attendeeDetails];
                        newDetails[index] = {...attendeeDetails[index], phone: text};
                        setAttendeeDetails(newDetails);
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
        
      </ScrollView>
    
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleContinue}
        >
          <Text className="text-background text-center font-semibold">
            Continue to checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}