
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, ChevronDown } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';
import { useGetcategoriesQuery } from '@/redux/api/eventsApiSlice';
import DateTimePickerModal from 'react-native-modal-datetime-picker';


interface Session {
  name: string;
  startDate: string;
  startTime: string;
  endTime: string;
}

export default function CreateEventScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    eventCategory:"",
    category_id: '',
    sessionType:'',
    state_id: 2,  // Assuming default
    city: '',
    country_code: 'NG',
    description: '',
    images: [],
    start_date: '2025-06-15',
    address: '',
    currency: '',
    each_ticket_identity: false,
    price: 0,
    is_free: false,
    event_type: 'SINGLE',  // Ensure correct API format
    time: '',
    absorb_fee: true,
    ticketed: true,
    tickets: [],
  });
  2
  const { data: categoriesData, isLoading, error }= useGetcategoriesQuery({})

  const [sessions, setSessions] = useState<Session[]|any>([{
    name: '',
    startDate: '',
    startTime: '',
    endTime: '',
  }]);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<{ sessionIndex: number; field: 'startTime' | 'endTime'|'startDate' } | null>(null);

  const categories = categoriesData?.body || [];
  const locations = [
    'The Grand Hall',
    'Downtown Convention Center',
    'City Park Amphitheater',
    'Metropolitan Museum',
    'Sports Complex',
  ];

  const addSession = () => {
    setSessions([...sessions, {
      name: '',
      startDate: '',
      startTime: '',
      endTime: '',
    }]);
  };


  const handleConfirmDate = (date: Date) => {
    if (activeTimeField !== null) {
      const formattedDate = date.toISOString().split('T')[0]; // Formats as YYYY-MM-DD
      updateSession(activeTimeField.sessionIndex, activeTimeField.field, formattedDate);    }
    setShowDatePicker(false);
  };
  

  const handleConfirmTime = (time: Date) => {
    if (activeTimeField !== null) {
      const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      updateSession(activeTimeField.sessionIndex, activeTimeField.field, formattedTime);
    }
    setShowTimePicker(false);
  };

  const updateSession = (index: number, field: keyof Session, value: string) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setSessions(newSessions);
  };
  const handleSaveAndContinue = () => {
    router.push({
      pathname: '/create/banner',
      params: {  
        courseData: JSON.stringify({
          ...formData,
          event_type: formData.event_type === 'recurring' ? 'RECURRING' : 'SINGLE',
          sessions: sessions.map((session:any) => ({
            name: session.name,
            date: session.startDate,
            start_time: session.startTime,
            end_time: session.endTime
          }))
        }),
      },
    });
  };
  
  useEffect(() => {
    if (error) {
      Alert.alert('Error', 'Failed to fetch categories.');
    }
  }, [error]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Create Event</Text>
      </View>
      <ProgressSteps currentStep={0} />


      <ScrollView className="flex-1 px-4">
        <View className="space-y-6">
        <View className="bg-[#111823] p-3 rounded-lg">
          <Text className='text-lg font-bold text-white mb-4'>Event Details</Text>
          <View>
            <Text className="text-white my-2">Event Title <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
              placeholder="Enter the name of your event"
              placeholderTextColor="#6B7280"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View>
             {/* Event Category */}
             <Text className="text-white my-2">Event Category <Text className="text-red-500">*</Text></Text>
            <TouchableOpacity 
              className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowCategoryModal(true)}
            >
              <Text className="text-gray-400">{formData.eventCategory || 'Please Select One'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-white my-2">Event Type <Text className="text-red-500">*</Text></Text>
            <View className="space-y-2">
              <TouchableOpacity 
                className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.event_type === 'single' ? 'border border-primary' : ''}`}
                onPress={() => setFormData({ ...formData, event_type: 'single' })}
              >
                <View className={`w-5 h-5 rounded-full border-2 ${formData.event_type === 'single' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                  {formData.event_type === 'single' && <View className="w-3 h-3 rounded-full bg-primary" />}
                </View>
                <Text className="text-white">Single Event</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.event_type === 'recurring' ? 'border border-primary' : ''}`}
                onPress={() => setFormData({ ...formData, event_type: 'recurring' })}
              >
                <View className={`w-5 h-5 rounded-full border-2 ${formData.event_type === 'recurring' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                  {formData.event_type === 'recurring' && <View className="w-3 h-3 rounded-full bg-primary" />}
                </View>
                <Text className="text-white">Recurring Event</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
          <View className="bg-[#111823] p-3 rounded-lg">
          <View>
            <Text className="text-white my-2">Session(S)</Text>
            <View className="space-y-2">
            <TouchableOpacity 
  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.sessionType === 'single' ? 'border border-primary' : ''}`}
  onPress={() => {
    setFormData({ ...formData, sessionType: 'single' });
    setSessions([{ name: '', startDate: '', startTime: '', endTime: '' }]);
  }}>
  <View className={`w-5 h-5 rounded-full border-2 ${formData.sessionType === 'single' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
  {formData.sessionType === 'single' && <View className="w-3 h-3 rounded-full bg-primary" />}
  </View>
  <Text className="text-white">Single Session</Text>
</TouchableOpacity>

<TouchableOpacity 
  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.sessionType === 'multiple' ? 'border border-primary' : ''}`}
  onPress={() => {
    setFormData({ ...formData, sessionType: 'multiple' });
    setSessions([{ name: '', startDate: '', startTime: '', endTime: '' }]);
  }}
>
  <View className={`w-5 h-5 rounded-full border-2 ${formData.sessionType === 'multiple' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
    {formData.sessionType === 'multiple' && <View className="w-3 h-3 rounded-full bg-primary" />}
  </View>
  <Text className="text-white">Multiple Session</Text>
</TouchableOpacity>
 </View>
</View>
{sessions.map((session:any, index:any) => (
<View key={index} className="space-y-4 border-b-2 border-cyan-600 mb-2">
<View>
            <Text className="text-white my-2">Session name <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white"
              placeholder="Enter the name of your this session"
              placeholderTextColor="#6B7280"
              value={session.name}
              onChangeText={(text) => updateSession(index, 'name', text)}
              />
          </View>
               {/* Start Date */}
      <View>
        <Text className="text-white my-2">Start Date <Text className="text-red-500">*</Text></Text>
        <TouchableOpacity className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between"
   onPress={() => {
    setActiveTimeField({ sessionIndex: index, field: 'startDate' });
    setShowDatePicker(true);
  }}>          <Text className="text-gray-400">{session.startDate ||null}</Text>
          <Calendar size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      {/* Start Time */}
      <View>
        <Text className="text-white my-2">Start Time <Text className="text-red-500">*</Text></Text>
        <TouchableOpacity className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between"
         onPress={() => {
          setActiveTimeField({ sessionIndex: index, field: 'startTime' });
          setShowTimePicker(true);
        }}>
          <Text className="text-gray-400">{session.startTime || null}</Text>
          <Clock size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      {/* End Time */}
      <View>
        <Text className="text-white my-2">End Time <Text className="text-red-500">*</Text></Text>
      <TouchableOpacity className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between" onPress={() => {
    setActiveTimeField({ sessionIndex: index, field: 'endTime' });
    setShowTimePicker(true);
  }}>
    <Text className="text-gray-400">{session.endTime || null}</Text>
    <Clock size={20} color="#6B7280" />
    </TouchableOpacity>
      </View>
      
      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setShowDatePicker(false)}
      />
      
      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setShowTimePicker(false)}
      />
            </View>
          ))}

          {formData.sessionType === 'multiple' && (
            <TouchableOpacity onPress={addSession} className="flex-row items-center my-2">
              <Text className="text-primary text-end font-bold">+ Add Session</Text>
            </TouchableOpacity>
          )}
</View>
<View className="bg-[#111823] p-3 rounded-lg">
              <Text className="text-white mb-4 font-bold">Location</Text>
              <Text className='text-gray-500 my-2'>Where will your event take place? <Text className="text-red-500">*</Text></Text>

            <TouchableOpacity 
              className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowLocationModal(true)}
            >
              <Text className="text-gray-400">{formData.address || 'Please Select One'}</Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="bg-[#111823] p-3 rounded-lg">
          <Text className="text-white my-2 font-bold">Event Description</Text>
          <Text className="text-gray-500 my-2">Additional Information</Text>
            <TextInput
              className="bg-[#1A2432] rounded-lg px-4 py-3 text-white h-32"
              placeholder="Describe what's special about your event & other important details."
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className="bg-primary rounded-lg py-4"
          onPress={handleSaveAndContinue}
        >
          <Text className="text-background text-center font-semibold">Save and continue</Text>
        </TouchableOpacity>
      </View>

   

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Select Category</Text>
            {isLoading ? (
              <Text className="text-white">Loading categories...</Text>
            ) : (
              <ScrollView className="max-h-96">
                {categories.map((category:any) => (
                  <TouchableOpacity key={category.id} className="py-4 border-b border-gray-700"
                    onPress={() => { setFormData({ ...formData, eventCategory: category?.name,category_id:category?.id }); setShowCategoryModal(false); }}>
                    <Text className="text-white">{category?.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
       

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Select Location</Text>
            <ScrollView className="max-h-96">
              {locations.map((location) => (
                <TouchableOpacity
                  key={location}
                  className="py-4 border-b border-gray-700"
                  onPress={() => {
                    setFormData({ ...formData, address:location });
                    setShowLocationModal(false);
                  }}
                >
                <Text className="text-white">{location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}