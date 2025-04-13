import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Modal, FlatList, Pressable, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';
import { useGetCurrenciesQuery } from '@/redux/api/currencyAPI';
import { RelativePathString } from 'expo-router';

export default function TicketingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { data: currencies, isLoading, error } = useGetCurrenciesQuery();
  const [isFormValid, setIsFormValid] = useState(false);

  // Parse formData correctly
  const [formData, setFormData] = useState(() => {
    try {
      const data = params.formData ? JSON.parse(params.formData as string) : {};
      // Initialize each_ticket_identity if not present
      if (data.each_ticket_identity === undefined) {
        data.each_ticket_identity = false;
      }
      return data;
    } catch (error) {
      console.error('Error parsing formData:', error);
      return { each_ticket_identity: false };
    }
  });

  // Extract event details
  const { tickets = [], event_type = 'SINGLE', is_free = false, currency = 'NGN', 
         absorb_fee = true, each_ticket_identity = false } = formData;

  // State for event type selection
  const [eventType, setEventType] = useState<'ticketed' | 'free'>(is_free ? 'free' : 'ticketed');

  // Ticket quantity options
  const ticketQuantityOptions = [100, 500, 1000, 3000, 5000, 10000, 20000, 50000];
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);

  // Modal states
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [seatTypeModalVisible, setSeatTypeModalVisible] = useState(false);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  // Seat type options
  const seatTypeOptions = ['SEAT', 'TABLE'];

  // Validate form whenever formData changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  // Function to validate the form
  const validateForm = () => {
    if (eventType === 'free') {
      setIsFormValid(true);
      return;
    }

    // For ticketed events
    let isValid = true;

    // Check currency is selected
    if (!currency) {
      isValid = false;
    }

    // Check at least one ticket exists
    if (tickets.length === 0) {
      isValid = false;
    }
    if (tickets.length === 0) {
      isValid = false;
    }

    // Check each ticket has required fields
    tickets.forEach((ticket:any) => {
      if (!ticket.name || !ticket.price || !ticket.quantity) {
        isValid = false;
      }
    });

    setIsFormValid(isValid);
  };

  // Function to add a new ticket
  const addTicket = () => {
    setFormData((prev: any) => ({
      ...prev,
      tickets: [...(prev.tickets || []), { 
        name: '', 
        price: '', 
        quantity: '', 
        seat_type: '', 
        no_per_seat_type: 0
      }]
    }));
  };

  // Function to remove a ticket
  const removeTicket = (index: number) => {
    const updatedTickets = [...tickets];
    updatedTickets.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, tickets: updatedTickets }));
  };

  // Function to update ticket details
  const updateTicket = (index: number, field: string, value: string | number) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = { ...updatedTickets[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, tickets: updatedTickets }));
  };

  // Function to handle currency change
  const handleCurrencyChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, currency: value }));
    setCurrencyModalVisible(false);
  };

  // Function to handle seat type change
  const handleSeatTypeChange = (value: string) => {
    updateTicket(currentTicketIndex, 'seat_type', value);
    setSeatTypeModalVisible(false);
  };

  // Toggle identity requirement
  const toggleIdentityRequirement = (value: boolean) => {
    setFormData((prev: any) => ({ ...prev, each_ticket_identity: value }));
  };

  const handleSaveAndContinue = () => {
    if (!isFormValid) return;
    
    router.push({
      pathname: `/(tabs)/home/event/${params.id}/update/updatereview` as RelativePathString,
      params: {
        formData: JSON.stringify(formData),
      },
    });
  };
  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
       <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-[#1A2432] p-2 rounded-full">
                   <ArrowLeft color="white" size={24} />
                 </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Update Event</Text>
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
                setFormData((prev:any) => ({ ...prev, is_free: false, ticketed: true }));
              }}
            >
              <Image source={require('../../../../../../assets/images/paid.png')} className="h-36 w-full" />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`bg-[#1A2432] p-6 rounded-lg flex-row items-center ${eventType === 'free' ? 'border border-primary' : ''}`}
              onPress={() => {
                setEventType('free');
                setFormData((prev:any) => ({ ...prev, is_free: true, ticketed: false, tickets: [] }));
              }}
            >
              <Image source={require('../../../../../../assets/images/free.png')} className="h-36 w-full" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Selection */}
        {eventType === 'ticketed' && (
          <View className="bg-[#111823] p-3 rounded-lg my-2">
            <Text className="text-white mb-2">Currency <Text className="text-red-500">*</Text></Text>
            {isLoading ? (
              <Text className="text-white py-4">Loading currencies...</Text>
            ) : error ? (
              <Text className="text-white py-4">Error loading currency</Text>
            ) : (
              <>
                <TouchableOpacity 
                  className={`bg-[#1A2432] rounded-lg px-4 py-3 border ${!currency ? 'border-red-500' : 'border-transparent'}`}
                  onPress={() => setCurrencyModalVisible(true)}
                >
                  <Text className="text-white">
                    {currency || 'Select a currency*'}
                  </Text>
                </TouchableOpacity>

                {/* Currency Modal */}
                <Modal
                  animationType="slide"
                  transparent={true} 
                  className=' h-[80%] '
                  visible={currencyModalVisible}
                  onRequestClose={() => setCurrencyModalVisible(false)}
                >
                  <View className="  h-[80%] justify-center bg-black/50">
                    <View className="m-4 bg-[#111823] rounded-lg p-4">
                      <Text className="text-white text-lg font-bold mt-20">Select Currency</Text>
                      <FlatList
                        data={currencies}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                          <Pressable
                            className={`p-3 ${currency === item.code ? 'bg-primary' : 'bg-[#1A2432]'}`}
                            onPress={() => handleCurrencyChange(item.code)}
                          >
                            <Text className={`${currency === item.code ? 'text-black' : 'text-white'}`}>
                              {item.code} - {item.name}
                            </Text>
                          </Pressable>
                        )}
                        ItemSeparatorComponent={() => <View className="h-px bg-gray-600" />}
                      />
                      <TouchableOpacity
                        className="mt-4 p-3 bg-red-500 rounded-lg"
                        onPress={() => setCurrencyModalVisible(false)}
                      >
                        <Text className="text-white text-center">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </>
            )}
          </View>
        )}

        {/* Ticketing Section */}
        {eventType === 'ticketed' && (
          <View className="mt-2">
            {/* Identity Requirement Checkbox */}
            <View className="bg-[#111823] p-3 rounded-lg my-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-white">Require identification for each ticket when booking</Text>
                <Switch
                  value={each_ticket_identity}
                  onValueChange={toggleIdentityRequirement}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={each_ticket_identity ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <View className="bg-[#111823] p-3 rounded-lg my-2">
            <Text className="text-white mb-4">What tickets are you selling? <Text className="text-red-500">*</Text></Text>
              {tickets.map((ticket: any, index: any) => (
                <View key={index} className="space-y-4 mb-6 relative">
                  {/* Remove Ticket Button (only show if more than one ticket) */}
                  {tickets.length > 1 && (
                    <TouchableOpacity 
                      className="absolute top-0 right-0 z-10 p-2"
                      onPress={() => removeTicket(index)}
                    >
                      <X color="red" size={20} />
                    </TouchableOpacity>
                  )}

                              {/* Ticket Name */}
                              <View>
                    <Text className="text-white mb-2">Ticket Name <Text className="text-red-500">*</Text></Text>
                    <TextInput
                      className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!ticket.name ? 'border-red-500' : 'border-transparent'}`}
                      placeholder="Ticket Name e.g. VIP*"
                      placeholderTextColor="#6B7280"
                      value={ticket.name}
                      onChangeText={(text) => updateTicket(index, 'name', text)}
                    />
                  </View>

                  {/* Ticket Price */}
                  <View>
                    <Text className="text-white mb-2">Ticket Price <Text className="text-red-500">*</Text></Text>
                    <View className={`flex-row items-center bg-[#1A2432] rounded-lg border ${!ticket.price ? 'border-red-500' : 'border-transparent'}`}>
                      <Text className="text-white px-4">{currency}</Text>
                      <TextInput
                        className="flex-1 py-3 text-white"
                        placeholder="1,000.00*"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        value={ticket.price.toString()}
                        onChangeText={(text) => updateTicket(index, 'price', parseFloat(text) || 0)}
                      />
                    </View>
                  </View>

                  {/* Ticket Quantity */}
                  <View>
                    <Text className="text-white mb-2">Quantity <Text className="text-red-500">*</Text></Text>
                    <TextInput
                      className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!ticket.quantity ? 'border-red-500' : 'border-transparent'}`}
                      placeholder="Enter quantity*"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      value={ticket.quantity.toString()}
                      onChangeText={(text) => updateTicket(index, 'quantity', parseInt(text) || 0)}
                    />
                  </View>

                  {/* Seat Type */}
                  <View>
                    <Text className="text-white mb-2">Seat Type</Text>
                    <TouchableOpacity 
                      className="bg-[#1A2432] rounded-lg px-4 py-3"
                      onPress={() => {
                        setCurrentTicketIndex(index);
                        setSeatTypeModalVisible(true);
                      }}
                    >
                      <Text className="text-white">
                        {ticket.seat_type || 'Select seat type'}
                      </Text>
                    </TouchableOpacity>

                    {/* Seat Type Modal */}
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={seatTypeModalVisible && currentTicketIndex === index}
                      onRequestClose={() => setSeatTypeModalVisible(false)}
                    >
                      <View className="flex-1 justify-center bg-black/50">
                        <View className="m-4 bg-[#111823] rounded-lg p-4">
                          <Text className="text-white text-lg font-bold mb-4">Select Seat Type</Text>
                          <FlatList
                            data={seatTypeOptions}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                              <Pressable
                                className={`p-3 ${ticket.seat_type === item ? 'bg-primary' : 'bg-[#1A2432]'}`}
                                onPress={() => handleSeatTypeChange(item)}
                              >
                                <Text className={`${ticket.seat_type === item ? 'text-black' : 'text-white'}`}>
                                  {item}
                                </Text>
                              </Pressable>
                            )}
                            ItemSeparatorComponent={() => <View className="h-px bg-gray-600" />}
                          />
                          <TouchableOpacity
                            className="mt-4 p-3 bg-red-500 rounded-lg"
                            onPress={() => setSeatTypeModalVisible(false)}
                          >
                            <Text className="text-white text-center">Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
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
          className={`rounded-lg py-4 ${isFormValid ? 'bg-primary' : 'bg-gray-500'}`}
          onPress={handleSaveAndContinue}
          disabled={!isFormValid}
        >
          <Text className="text-background text-center font-semibold">Save and Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}