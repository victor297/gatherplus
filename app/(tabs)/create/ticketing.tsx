import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';

export default function TicketingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ✅ Parse formData correctly
  const [formData, setFormData] = useState(() => {
    try {
      return params.formData ? JSON.parse(params.formData as string) : {};
    } catch (error) {
      console.error('Error parsing formData:', error);
      return {};
    }
  });

  // ✅ Extract event details
  const { tickets = [], event_type = 'SINGLE', is_free = false, currency = 'NGN', absorb_fee = true } = formData;

  // ✅ State for event type selection
  const [eventType, setEventType] = useState<'ticketed' | 'free'>(is_free ? 'free' : 'ticketed');

  // ✅ Ticket quantity options
  const ticketQuantityOptions = [100, 500, 1000, 3000, 5000, 10000, 20000, 50000];
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);

  // ✅ Function to add a new ticket
  const addTicket = () => {
    setFormData((prev:any) => ({
      ...prev,
      tickets: [...(prev.tickets || []), { name: '', price: '', quantity: '', seat_type: '', no_per_seat_type: 0 }]
    }));
  };

  // ✅ Function to update ticket details
  const updateTicket = (index: number, field: string, value: string | number) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = { ...updatedTickets[index], [field]: value };
    setFormData((prev:any) => ({ ...prev, tickets: updatedTickets }));
  };

  const handleSaveAndContinue = () => {
    router.push({
      pathname: '/create/review',
      params: {
        formData: JSON.stringify(formData), // Ensure updated image URL is included
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Create Event</Text>
      </View>

      <ProgressSteps currentStep={2} />

      <ScrollView className="flex-1 px-4">
        {/* Event Type Selection */}
        <View className="bg-[#111823] p-3 rounded-lg">
          <Text className="text-white mb-4">What type of event are you running? <Text className="text-red-500">*</Text></Text>

          <View className="space-y-4">
            <TouchableOpacity 
              className={`bg-[#1A2432] p-6 rounded-lg flex-row items-center ${eventType === 'ticketed' ? 'border border-primary' : ''}`}
              onPress={() => {
                setEventType('ticketed');
                setFormData((prev:any) => ({ ...prev, is_free: false,ticketed: true }));
              }}
            >
              <Image source={require('../../../assets/images/paid.png')} className="h-36 w-full" />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`bg-[#1A2432] p-6 rounded-lg flex-row items-center ${eventType === 'free' ? 'border border-primary' : ''}`}
              onPress={() => {
                setEventType('free');
                setFormData((prev:any) => ({ ...prev, is_free: true,ticketed: false, tickets: [] }));
              }}
            >
              <Image source={require('../../../assets/images/free.png')} className="h-36 w-full" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ticketing Section */}
        {eventType === 'ticketed' && (
          <View className="mt-6">
            <View className="bg-[#111823] p-3 rounded-lg my-2">
              <Text className="text-white mb-4">What tickets are you selling?</Text>

              {tickets.map((ticket:any, index:any) => (
                <View key={index} className="space-y-4 mb-6">
                  {/* Ticket Name */}
                  <View>
                    <Text className="text-white mb-2">Ticket Name <Text className="text-red-500">*</Text></Text>
                    <TextInput
                      className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                      placeholder="Ticket Name e.g. VIP"
                      placeholderTextColor="#6B7280"
                      value={ticket.name}
                      onChangeText={(text) => updateTicket(index, 'name', text)}
                    />
                  </View>

                  {/* Ticket Price */}
                  <View>
                    <Text className="text-white mb-2">Ticket Price <Text className="text-red-500">*</Text></Text>
                    <View className="flex-row items-center bg-[#1A2432] rounded-lg">
                      <Text className="text-white px-4">₦</Text>
                      <TextInput
                        className="flex-1 py-3 text-white"
                        placeholder="1,000.00"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        value={ticket.price.toString()}
                        onChangeText={(text) => updateTicket(index, 'price', parseFloat(text) || 0)}
                      />
                      <Text className="text-gray-400 px-4">{currency}</Text>
                    </View>
                  </View>

                  {/* Ticket Quantity */}
                  <View>
                    <Text className="text-white mb-2">Quantity <Text className="text-red-500">*</Text></Text>
                    <TextInput
                      className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                      placeholder="Enter quantity"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      value={ticket.quantity.toString()}
                      onChangeText={(text) => updateTicket(index, 'quantity', parseInt(text) || 0)}
                    />
                  </View>

                  {/* Seat Type */}
                  <View>
                    <Text className="text-white mb-2">Seat Type</Text>
                    <TextInput
                      className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                      placeholder="SEAT or TABLE"
                      placeholderTextColor="#6B7280"
                      value={ticket.seat_type}
                      onChangeText={(text) => updateTicket(index, 'seat_type', text)}
                    />
                  </View>

                  {/* No. of Persons per Seat Type */}
                  <View>
                    <Text className="text-white mb-2">Persons per Seat Type</Text>
                    <TextInput
                      className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
                      placeholder="Number per seat type"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      value={ticket.no_per_seat_type.toString()}
                      onChangeText={(text) => updateTicket(index, 'no_per_seat_type', parseInt(text) || 0)}
                    />
                  </View>
                </View>
              ))}

              {/* Add Ticket Button */}
              <TouchableOpacity onPress={addTicket} className="mb-6">
                <Text className="text-primary">+ Add Ticket</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-[#111823] p-3 rounded-lg my-2">
      <Text className="text-white mb-4">How many tickets are you selling?</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {ticketQuantityOptions.map((quantity) => (
          <TouchableOpacity
            key={quantity}
            className={`bg-[#1A2432] px-4 py-2 rounded-lg ${
              selectedQuantity === quantity ? 'border border-primary' : ''
            }`}
            onPress={() => setSelectedQuantity(quantity)}
          >
            <Text className={`${selectedQuantity === quantity ? 'text-primary' : 'text-white'}`}>
              {quantity.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <Text className="text-white mb-2">
          Enter Manually <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
          placeholder="500"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={selectedQuantity?.toString()}
          onChangeText={(text) => setSelectedQuantity(parseInt(text) || null)}
        />
      </View>
            
          </View>
          </View>
        )}
      </ScrollView>

      {/* Save and Continue Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleSaveAndContinue}
        >
          <Text className="text-background text-center font-semibold">Save and Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
