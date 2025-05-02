import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Mail, Phone } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { useGetEventQuery } from '@/redux/api/eventsApiSlice';

interface AttendeeDetails {
  fullname: string;
  email: string;
  phone: string;
  dob?:string;

}

export default function CheckoutScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ticketData: any = JSON.parse(data as string);
  const { userInfo } = useSelector((state: any) => state.auth);
  const { data: event, isLoading, error, refetch } = useGetEventQuery({ id: ticketData?.eventId, user_id: userInfo?.sub });
  const [isFormValid, setIsFormValid] = useState(false);

  const [useCommonDetails, setUseCommonDetails] = useState(ticketData.each_ticket_identity);
  const [commonDetails, setCommonDetails] = useState<AttendeeDetails>({
    fullname: '',
    email: '',
    phone: '',
    ...(event?.body?.age_restriction && { dob: '' })
  });
  
  const [attendeeDetails, setAttendeeDetails] = useState<AttendeeDetails[]>(
    Array(ticketData.ticketInstances.length).fill({
      fullname: '',
      email: '',
      phone: '',
      ...(event?.body?.age_restriction && { dob: '' })
    })
  );
console.log(event?.body?.age_restriction,"checkout")
  // Validate form whenever details change
  useEffect(() => {
    validateForm();
  }, [commonDetails, attendeeDetails, useCommonDetails]);

  const validateForm = () => {
    const needsDOB = event?.body?.age_restriction;
    
    if (useCommonDetails) {
      // Validate common details
      const isValid = commonDetails.fullname.trim() !== '' && 
                     commonDetails.email.trim() !== '' && 
                     commonDetails.phone.trim() !== '' &&
                     (!needsDOB || (needsDOB && commonDetails.dob));
      setIsFormValid(isValid);
    } else {
      // Validate all individual attendee details
      const allValid = attendeeDetails.every(attendee => 
        attendee.fullname.trim() !== '' && 
        attendee.email.trim() !== '' && 
        attendee.phone.trim() !== '' &&
        (!needsDOB || (needsDOB && attendee.dob))
      );
      setIsFormValid(allValid);
    }
  };
  const handleContinue = () => {
    if (!isFormValid) return;

    // Prepare data for backend
    const bookings = useCommonDetails 
      ? ticketData.ticketInstances.map((instance:any)=> ({
          ...commonDetails,
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name: instance.name,
          price: instance.price
        }))
      : ticketData.ticketInstances.map((instance:any, index:any) => ({
          ...attendeeDetails[index],
          session_id: instance.sessionId,
          ticket_id: instance.ticketId,
          name: instance.name,
          price: instance.price
        }));

    const bookingData = {
      event_id: Number(ticketData.eventId),
      currency:ticketData?.currency,
      channel: "PayStack",
      bookings
    };

    router.push({
      pathname: `/home/event/${ticketData?.eventId}/summary`,
      params: { data: JSON.stringify(bookingData) }
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-4">
        <Text className="text-white text-center mb-4">Failed to load event details</Text>
        <TouchableOpacity 
          className="bg-primary rounded-lg px-6 py-3"
          onPress={() => refetch()}
        >
          <Text className="text-background">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Event Details</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="mb-6">
          <TouchableOpacity
            className={`p-4 rounded-lg mb-4 ${useCommonDetails ? 'bg-primary' : 'bg-[#1A2432]'}`}
            onPress={() => setUseCommonDetails(true)}
          >
            <Text className={useCommonDetails ? 'text-background' : 'text-white'}>
              Use same details for all tickets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-lg ${!useCommonDetails ? 'bg-primary' : 'bg-[#1A2432]'}`}
            onPress={() => setUseCommonDetails(false)}
          >
            <Text className={!useCommonDetails ? 'text-background' : 'text-white'}>
              Add individual details for each ticket
            </Text>
          </TouchableOpacity>
        </View>

        {useCommonDetails ? (
          <View className="space-y-4">
            <View>
              <Text className="text-white mb-2">Full Name <Text className="text-red-500">*</Text></Text>
              <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!commonDetails.fullname ? 'border-red-500' : 'border-transparent'}`}>
                <User size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter full name*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.fullname}
                  onChangeText={(text) => setCommonDetails({...commonDetails, fullname: text})}
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">Email <Text className="text-red-500">*</Text></Text>
              <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!commonDetails.email ? 'border-red-500' : 'border-transparent'}`}>
                <Mail size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter email*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.email}
                  onChangeText={(text) => setCommonDetails({...commonDetails, email: text})}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <Text className="text-white mb-2">Phone <Text className="text-red-500">*</Text></Text>
              <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!commonDetails.phone ? 'border-red-500' : 'border-transparent'}`}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-white text-xl py-2"
                  placeholder="Enter phone number*"
                  placeholderTextColor="#6B7280"
                  value={commonDetails.phone}
                  onChangeText={(text) => setCommonDetails({...commonDetails, phone: text})}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {event?.body?.age_restriction && (
  <View>
    <Text className="text-white mb-2">Date of Birth <Text className="text-red-500">*</Text></Text>
    <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!commonDetails.dob ? 'border-red-500' : 'border-transparent'}`}>
      <TextInput
        className="flex-1 text-white text-xl py-2"
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#6B7280"
        value={commonDetails.dob}
        onChangeText={(text) => setCommonDetails({...commonDetails, dob: text})}
        keyboardType="numbers-and-punctuation"
      />
    </View>
    <Text className="text-gray-400 text-sm mt-1">Format: YYYY-MM-DD</Text>
  </View>
)}
          </View>
        ) : (
          ticketData.ticketInstances.map((instance:any, index:any) => (
            <View key={index} className="mb-6">
              <View className="bg-[#4d6382] rounded-lg p-4 mb-4">
                <Text className="text-white">Ticket {index + 1}</Text>
                <Text className="text-gray-400">
                  Session: {event?.body?.sessions.find(s => s.id === instance.sessionId)?.name} {event?.body?.sessions.find(s => s.id === instance.sessionId)?.start_time} - {event?.body?.sessions.find(s => s.id === instance.sessionId)?.end_time}
                </Text>
              </View>
              
              <View className="space-y-4">
                <View>
                  <Text className="text-white mb-2">Full Name <Text className="text-red-500">*</Text></Text>
                  <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!attendeeDetails[index].fullname ? 'border-red-500' : 'border-transparent'}`}>
                    <User size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2 "
                      placeholder="Enter full name*"
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
                  <Text className="text-white mb-2">Email <Text className="text-red-500">*</Text></Text>
                  <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!attendeeDetails[index].email ? 'border-red-500' : 'border-transparent'}`}>
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2"
                      placeholder="Enter email*"
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
                  <Text className="text-white mb-2">Phone <Text className="text-red-500">*</Text></Text>
                  <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!attendeeDetails[index].phone ? 'border-red-500' : 'border-transparent'}`}>
                    <Phone size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-xl py-2"
                      placeholder="Enter phone number*"
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

                {event?.body?.age_restriction && (
  <View>
    <Text className="text-white mb-2">Date of Birth <Text className="text-red-500">*</Text></Text>
    <View className={`flex-row items-center bg-[#1A2432] rounded-lg px-4 border ${!attendeeDetails[index].dob ? 'border-red-500' : 'border-transparent'}`}>
      <TextInput
        className="flex-1 text-white text-xl py-2"
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#6B7280"
        value={attendeeDetails[index].dob}
        onChangeText={(text) => {
          const newDetails = [...attendeeDetails];
          newDetails[index] = {...attendeeDetails[index], dob: text};
          setAttendeeDetails(newDetails);
        }}
        keyboardType="numbers-and-punctuation"
      />
    </View>
    <Text className="text-gray-400 text-sm mt-1">Format: YYYY-MM-DD</Text>
  </View>
)}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`rounded-lg py-4 ${isFormValid ? 'bg-primary' : 'bg-gray-500'}`}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text className="text-background text-center font-semibold">
            Continue to checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}