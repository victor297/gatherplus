import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, Image, KeyboardAvoidingView } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, ChevronDown } from 'lucide-react-native';
import ProgressSteps from '@/app/components/create/ProgressSteps';
import { useGetcategoriesQuery, useGetCountriesQuery, useGetStatesQuery } from '@/redux/api/eventsApiSlice';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

interface Participant {
  label: string;
  title: string;
  name: string;
  description: string;
  image?: string;
  imageUploading?: boolean;
  imageError?: string;
}
interface Session {
  name: string;
  startDate: string;
  startTime: string;
  endTime: string;
  participants: Participant[];
}
export default function CreateEventScreen() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    eventCategory: "",
    category_id: '',
    sessionType: '',
    state_id: 2,
    city: '',
    country_code: 'NG',
    description: '',
    images: [],
    start_date: '2025-06-15',
    address: '',
    currency: '',
    each_ticket_identity: true,
    price: 0,
    age_restriction: 0,
    guardian_required: false,
    is_free: false,
    event_type: 'SINGLE',
    time: '',
    absorb_fee: true,
    ticketed: true,
    tickets: [],
  });
  const pathname = usePathname();
console.log(pathname,"path")
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetcategoriesQuery({});
  const { data: countryData, isLoading: countryLoading, error: countryError } = useGetCountriesQuery({});
  const { data: stateData, isLoading: stateLoading, error: stateError } = useGetStatesQuery(selectedCountry?.code2, {
    skip: !selectedCountry,
  });
  const [sessions, setSessions] = useState<Session[] | any>([{
    name: '',
    startDate: '',
    startTime: '',
    endTime: '',
    participants: []
  }]);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<{ sessionIndex: number; field: 'startTime' | 'endTime' | 'startDate' } | null>(null);
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = useState(false);

  const categories = categoriesData?.body || [];
  const countries = countryData?.body || [];
  const states = stateData?.body || [];

  // Validate form whenever form data changes
  useEffect(() => {
    validateForm();
  }, [formData, sessions, selectedCountry, selectedState]);

  // Check if all data is loaded
  useEffect(() => {
    if (!categoriesLoading && !countryLoading) {
      setIsLoadingData(false);
    }
  }, [categoriesLoading, countryLoading]);

  const validateForm = () => {
    // Basic validation
    let isValid = true;

    // Event details validation
    if (!formData.title.trim()) isValid = false;
    if (!formData.eventCategory) isValid = false;
    if (!formData.event_type) isValid = false;

    // Sessions validation
    if (sessions.length === 0) isValid = false;
    sessions.forEach((session:any) => {
      if (!session.name.trim()) isValid = false;
      if (!session.startDate) isValid = false;
      if (!session.startTime) isValid = false;
      if (!session.endTime) isValid = false;
    });

    // Location validation
    if (!selectedCountry) isValid = false;
    if (!selectedState) isValid = false;
    if (!formData.city.trim()) isValid = false;
    if (!formData.address.trim()) isValid = false;

    setIsFormValid(isValid);
  };

  const addSession = () => {
    setSessions([...sessions, {
      name: '',
      startDate: '',
      startTime: '',
      endTime: '',
    }]);
  };
  const addParticipant = (sessionIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants.push({
      label: '',
      title: '',
      name: '',
      description: '',
      image: ''
    });
    setSessions(newSessions);
  };
  
  const updateParticipant = (sessionIndex: number, participantIndex: number, field: keyof Participant, value: string) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants[participantIndex][field] = value;
    setSessions(newSessions);
  };
  const handleConfirmDate = (date: Date) => {
    if (activeTimeField !== null) {
      const formattedDate = date.toISOString().split('T')[0];
      updateSession(activeTimeField.sessionIndex, activeTimeField.field, formattedDate);
    }
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
    if (!isFormValid) return;
  
    router.push({
      pathname: '/create/banner',
      params: {
        formData: JSON.stringify({
          ...formData,
          event_type: formData.event_type === 'recurring' ? 'RECURRING' : 'SINGLE',
          sessions: sessions.map((session: any) => ({
            name: session.name,
            date: session.startDate,
            start_time: session.startTime,
            end_time: session.endTime,
            participants: session.participants.map(({ imageUploading, ...rest }: any) => rest)
          }))
        }),
      },
    });
  };
  
  const removeSession = (index: number) => {
    if (sessions.length > 1) { // Don't allow removing the last session
      const newSessions = [...sessions];
      newSessions.splice(index, 1);
      setSessions(newSessions);
    } else {
      Alert.alert("Cannot remove", "You need at least one session");
    }
  };
  
  const removeParticipant = (sessionIndex: number, participantIndex: number) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants.splice(participantIndex, 1);
    setSessions(newSessions);
  };

  const uploadParticipantImage = async (sessionIndex: number, participantIndex: number, imageUri: string) => {
    // Update state to show uploading status
    const newSessions = [...sessions];
    newSessions[sessionIndex].participants[participantIndex].imageUploading = true;
    newSessions[sessionIndex].participants[participantIndex].imageError = undefined;
    setSessions(newSessions);
  
    // Prepare FormData
    const formDataUpload = new FormData();
    const fileName = imageUri.split('/').pop();
    const fileType = fileName?.split('.').pop();
  
    formDataUpload.append('files', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);
  
    try {
      const response = await fetch('https://gather-plus-backend-core.onrender.com/api/v1/file', {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      const data = await response.json();
      
      if (response.ok) {
        // Update participant with the new image URL
        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex].participants[participantIndex].image = data.body[0].url; // Adjust based on your API response
        updatedSessions[sessionIndex].participants[participantIndex].imageUploading = false;
        setSessions(updatedSessions);
      } else {
        throw new Error(data.message || 'Failed to upload image');
      }
    } catch (error) {
      const errorSessions = [...sessions];
      errorSessions[sessionIndex].participants[participantIndex].imageUploading = false;
      errorSessions[sessionIndex].participants[participantIndex].imageError = error.message;
      setSessions(errorSessions);
      console.error('Image upload error:', error);
    }
  };


const pickImage = async (sessionIndex: number, participantIndex: number) => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'We need camera roll permissions to upload images');
    return;
  }

  // Launch image picker
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const imageUri = result.assets[0].uri;
    await uploadParticipantImage(sessionIndex, participantIndex, imageUri);
  }
};
  useEffect(() => {
    if (categoriesError || countryError || stateError) {
      Alert.alert('Error', 'Failed to fetch required data. Please try again.');
    }
  }, [categoriesError, countryError, stateError]);

  if (isLoadingData) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator color="#9EDD45" />
        <Text className="text-white mt-4">Loading event data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.replace('/home/home1')} className="mr-4 bg-[#1A2432] p-2 rounded-full">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Create Event</Text>
      </View>
      <ProgressSteps currentStep={0} />

      <ScrollView className="flex-1 px-4">
        <View className="space-y-6">
          {/* Event Details Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className='text-lg font-bold text-white mb-4'>Event Details</Text>
            
            {/* Event Title */}
            <View>
              <Text className="text-white my-2">Event Title <Text className="text-red-500">*</Text></Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!formData.title ? 'border-red-500' : 'border-transparent'}`}
                placeholder="Enter the name of your event*"
                placeholderTextColor="#6B7280"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            {/* Event Category */}
            <View>
              <Text className="text-white my-2">Event Category <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity
                className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center border ${!formData.eventCategory ? 'border-red-500' : 'border-transparent'}`}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text className={formData.eventCategory ? "text-white" : "text-gray-400"}>
                  {formData.eventCategory || 'Please Select One*'}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Event Type */}
            <View>
              <Text className="text-white my-2">Event Type <Text className="text-red-500">*</Text></Text>
              <View className="space-y-2">
                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.event_type === 'single' ? 'border border-primary' : 'border-transparent'}`}
                  onPress={() => setFormData({ ...formData, event_type: 'single' })}
                >
                  <View className={`w-5 h-5 rounded-full border-2 ${formData.event_type === 'single' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                    {formData.event_type === 'single' && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                  <Text className="text-white">Single Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.event_type === 'recurring' ? 'border border-primary' : 'border-transparent'}`}
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

          {/* Sessions Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <View>
              <Text className="text-white my-2">{`Session(S)`} <Text className="text-red-500">*</Text></Text>
              <View className="space-y-2">
                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.sessionType === 'single' ? 'border border-primary' : 'border-transparent'}`}
                  onPress={() => {
                    setFormData({ ...formData, sessionType: 'single' });
    setSessions([{
      name: '',
      startDate: '',
      startTime: '',
      endTime: '',
      participants: []
    }]);
  }}                  >
                  <View className={`w-5 h-5 rounded-full border-2 ${formData.sessionType === 'single' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                    {formData.sessionType === 'single' && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                  <Text className="text-white">Single Session</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center bg-[#1A2432] rounded-lg p-4 ${formData.sessionType === 'multiple' ? 'border border-primary' : 'border-transparent'}`}
                  onPress={() => {
                    setFormData({ ...formData, sessionType: 'multiple' });
                    setSessions([{
                      name: '',
                      startDate: '',
                      startTime: '',
                      endTime: '',
                      participants: []
                    }]);                  }}
                >
                  <View className={`w-5 h-5 rounded-full border-2 ${formData.sessionType === 'multiple' ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                    {formData.sessionType === 'multiple' && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                  <Text className="text-white">Multiple Session</Text>
                </TouchableOpacity>
              </View>
            </View>

            {sessions.map((session: any, sessionIndex: number) => (
  <View key={sessionIndex} className="space-y-4 border-b-2 border-cyan-600 mb-2 p-3">
    {/* Session Header with Remove Button (only for multiple sessions) */}
    {formData.sessionType === 'multiple' && (
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white font-bold text-lg">Session {sessionIndex + 1}</Text>
        <TouchableOpacity 
          onPress={() => removeSession(sessionIndex)}
          className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500"
        >
          <Text className="text-red-500">Remove Session</Text>
        </TouchableOpacity>
      </View>
    )}
    
   
                {/* Session Name */}
                <View>
                  <Text className="text-white my-2">Session name<Text className="text-red-500">*</Text></Text>
                  <TextInput
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!session.name ? 'border-red-500' : 'border-transparent'}`}
                    placeholder="Enter the name of your this session*"
                    placeholderTextColor="#6B7280"
                    value={session.name}
                    onChangeText={(text) => updateSession(sessionIndex, 'name', text)}
                  />
                </View>

                {/* Start Date */}
                <View>
                  <Text className="text-white my-2">Start Date<Text className="text-red-500">*</Text></Text>
                  <TouchableOpacity 
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${!session.startDate ? 'border-red-500' : 'border-transparent'}`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: 'startDate' });
                      setShowDatePicker(true);
                    }}>         
                    <Text className={session.startDate ? "text-white" : "text-gray-400"}>
                      {session.startDate || 'Select start date*'}
                    </Text>
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Start Time */}
                <View>
                  <Text className="text-white my-2">Start Time <Text className="text-red-500">*</Text></Text>
                  <TouchableOpacity 
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${!session.startTime ? 'border-red-500' : 'border-transparent'}`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: 'startTime' });
                      setShowTimePicker(true);
                    }}>
                    <Text className={session.startTime ? "text-white" : "text-gray-400"}>
                      {session.startTime || 'Select start time*'}
                    </Text>
                    <Clock size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* End Time */}
                <View>
                  <Text className="text-white my-2">End Time <Text className="text-red-500">*</Text></Text>
                  <TouchableOpacity 
                    className={`bg-[#1A2432] rounded-lg px-4 py-3 flex-row items-center justify-between border ${!session.endTime ? 'border-red-500' : 'border-transparent'}`}
                    onPress={() => {
                      setActiveTimeField({ sessionIndex, field: 'endTime' });
                      setShowTimePicker(true);
                    }}>
                    <Text className={session.endTime ? "text-white" : "text-gray-400"}>
                      {session.endTime || 'Select end time*'}
                    </Text>
                    <Clock size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

    {/* Participants Section */}
    <View className="mt-4">
      <Text className="text-white text-lg font-bold mb-3">Presenter/Host</Text>
      
      {session.participants.map((participant: any, participantIndex: number) => (
        <View key={participantIndex} className="bg-[#1A2432] p-4 rounded-lg mb-4 border border-gray-700">
          {/* Participant Header */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold">Participant {participantIndex + 1}</Text>
            <TouchableOpacity 
              onPress={() => removeParticipant(sessionIndex, participantIndex)}
              className="bg-red-500/20 px-2 py-1 rounded-lg border border-red-500"
            >
              <Text className="text-red-500 text-xs">Remove</Text>
            </TouchableOpacity>
          </View>
          
          {/* Participant Fields */}
          <TextInput
            className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
            placeholder="Role (e.g., Keynote Speaker)"
            placeholderTextColor="#6B7280"
            value={participant.label}
            onChangeText={(text) => updateParticipant(sessionIndex, participantIndex, 'label', text)}
          />
          
          <TextInput
            className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
            placeholder="Presenter Name"
            placeholderTextColor="#6B7280"
            value={participant.name}
            onChangeText={(text) => updateParticipant(sessionIndex, participantIndex, 'name', text)}
          />
          
          <TextInput
            className="bg-[#111823] rounded-lg px-4 py-3 text-white mb-3"
            placeholder="Presentation Title"
            placeholderTextColor="#6B7280"
            value={participant.title}
            onChangeText={(text) => updateParticipant(sessionIndex, participantIndex, 'title', text)}
          />
          
          <TextInput
            className="bg-[#111823] rounded-lg px-4 py-3 text-white h-20 mb-3"
            placeholder="Description"
            placeholderTextColor="#6B7280"
            multiline
            textAlignVertical="top"
            value={participant.description}
            onChangeText={(text) => updateParticipant(sessionIndex, participantIndex, 'description', text)}
          />
          
          {/* Image Upload Section */}
          <View className="mt-3">
            <Text className="text-white mb-2">Presenter Image</Text>
            
            {participant.image ? (
              <View className="items-center">
                <View className="relative">
                  <Image 
                    source={{ uri: participant.image }} 
                    className="w-24 h-24 rounded-full mb-2 border-2 border-primary"
                  />
                  {participant.imageUploading && (
                    <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
                      <ActivityIndicator color="#9EDD45" />
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => pickImage(sessionIndex, participantIndex)}
                  className="bg-primary/20 px-3 py-1 rounded-lg border border-primary"
                >
                  <Text className="text-primary">Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => pickImage(sessionIndex, participantIndex)}
                className="border-2 border-dashed border-gray-500 rounded-lg p-6 items-center justify-center bg-[#111823]"
              >
                {participant.imageUploading ? (
                  <View className="items-center">
                    <ActivityIndicator color="#9EDD45" />
                    <Text className="text-white text-xs mt-2">Uploading...</Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-white">Tap to upload image</Text>
                    <Text className="text-gray-400 text-xs mt-1">Recommended: 500x500px</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {participant.imageError && (
              <Text className="text-red-500 text-xs mt-1">{participant.imageError}</Text>
            )}
          </View>
        </View>
      ))}
      
      {/* Add Participant Button */}
      <TouchableOpacity 
        onPress={() => addParticipant(sessionIndex)} 
        className="flex-row items-center justify-center bg-[#1A2432] p-3 rounded-lg border border-primary/50 mb-4"
      >
        <Text className="text-primary font-bold">+ Add Presenter</Text>
      </TouchableOpacity>
    </View>
  </View>
))}

            {formData.sessionType === 'multiple' && (
              <TouchableOpacity onPress={addSession} className="flex-row items-center my-2">
                <Text className="text-primary text-end font-bold">+ Add Session</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Age Restrictions Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white mb-4 font-bold">Age Restrictions</Text>
            <TouchableOpacity
              className="bg-[#1A2432] rounded-lg px-4 py-3 flex-row justify-between items-center"
              onPress={() => setShowAgeRestrictionModal(true)}
            >
              <Text className="text-gray-400">
                {formData.age_restriction === 0
                  ? "All ages allowed"
                  : formData.guardian_required
                    ? `Age ${formData.age_restriction}+ (Guardian required)`
                    : `Age ${formData.age_restriction}+`}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Location Section */}
          <View className="bg-[#111823] p-3 rounded-lg">
            <Text className="text-white mb-4 font-bold">Location</Text>
            <Text className='text-gray-500 my-2'>Where will your event take place? <Text className="text-red-500">*</Text></Text>

            <View className="flex-row items-center">
              <TouchableOpacity
                className={`bg-[#1A2432] w-full rounded-lg px-4 py-3 flex-row justify-between items-center border ${!selectedCountry || !selectedState ? 'border-red-500' : 'border-transparent'}`}
                onPress={() => setShowCountryModal(true)}
              >
                <Text className={selectedCountry && selectedState ? "text-white" : "text-gray-400"}>
                  {selectedCountry && selectedState ? `${selectedState.name}, ${selectedCountry.name}` : 'Select Location*'}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* City */}
            <View>
              <Text className="text-white my-2">City <Text className="text-red-500">*</Text></Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!formData.city ? 'border-red-500' : 'border-transparent'}`}
                placeholder="Enter City*"
                placeholderTextColor="#6B7280"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>

            {/* Address */}
            <View>
              <Text className="text-white my-2">Address <Text className="text-red-500">*</Text></Text>
              <TextInput
                className={`bg-[#1A2432] rounded-lg px-4 py-3 text-white border ${!formData.address ? 'border-red-500' : 'border-transparent'}`}
                placeholder="Enter Street Address*"
                placeholderTextColor="#6B7280"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
              />
            </View>
          </View>

          {/* Event Description */}
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

      {/* Save and Continue Button */}
      <View className="p-4 border-t border-[#1A2432]">
        <TouchableOpacity
          className={`rounded-lg py-4 ${isFormValid ? 'bg-primary' : 'bg-gray-500'}`}
          onPress={handleSaveAndContinue}
          disabled={!isFormValid}
        >
          <Text className="text-background text-center font-semibold">Save and continue</Text>
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

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Select Category</Text>
            {categoriesLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {categories.map((category: any) => (
                  <TouchableOpacity 
                    key={category.id} 
                    className="py-4 border-b border-gray-700"
                    onPress={() => { 
                      setFormData({ ...formData, eventCategory: category?.name, category_id: category?.id }); 
                      setShowCategoryModal(false); 
                    }}
                  >
                    <Text className="text-white">{category?.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal visible={showCountryModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowCountryModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Select Country</Text>
            {countryLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {countries.map((country: any) => (
                  <TouchableOpacity
                    key={country.code2}
                    className="py-4 border-b border-gray-700"
                    onPress={() => {
                      setSelectedCountry(country);
                      setSelectedState(null);
                      setShowCountryModal(false);
                      setShowStateModal(true);
                    }}
                  >
                    <Text className="text-white">{country.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* State Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowStateModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Select State</Text>
            {stateLoading ? (
              <ActivityIndicator color="#9EDD45" />
            ) : (
              <ScrollView className="max-h-96">
                {states.map((state: any) => (
                  <TouchableOpacity
                    key={state.id}
                    className="py-4 border-b border-gray-700"
                    onPress={() => {
                      setFormData({ ...formData, state_id: state.id });
                      setSelectedState(state);
                      setShowStateModal(false);
                    }}
                  >
                    <Text className="text-white">{state.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Age Restriction Modal */}
      <Modal visible={showAgeRestrictionModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowAgeRestrictionModal(false)}
        >
          <View className="bg-[#1A2432] rounded-t-3xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">Age Restrictions</Text>
            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  age_restriction: 0,
                  guardian_required: false
                });
                setShowAgeRestrictionModal(false);
              }}
            >
              <Text className="text-white">All ages allowed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  age_restriction: formData.age_restriction > 0 ? formData.age_restriction : 18,
                  guardian_required: false
                });
              }}
            >
              <Text className="text-white">There's an age restriction</Text>
            </TouchableOpacity>

            {/* Age selection options */}
            {formData.age_restriction > 0 && (
              <ScrollView className="max-h-64 ml-4">
                {Array.from({ length: 52 }, (_, i) => i).map(age => (
                  <TouchableOpacity
                    key={age}
                    className="py-3 border-b border-gray-700"
                    onPress={() => {
                      setFormData({
                        ...formData,
                        age_restriction: age,
                      });
                    }}
                  >
                    <Text className={`text-white ${formData.age_restriction === age ? 'font-bold text-primary' : ''}`}>
                      {age === 0 ? 'All ages' : `Age ${age}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Guardian required option */}
            <TouchableOpacity
              className="py-4 border-b border-gray-700"
              onPress={() => {
                setFormData({
                  ...formData,
                  guardian_required: !formData.guardian_required,
                  age_restriction: formData.age_restriction > 0 ? formData.age_restriction : 18
                });
              }}
            >
              <View className="flex-row items-center">
                <View className={`w-5 h-5 rounded-full border-2 ${formData.guardian_required ? 'border-primary' : 'border-gray-400'} mr-3 items-center justify-center`}>
                  {formData.guardian_required && <View className="w-3 h-3 rounded-full bg-primary" />}
                </View>
                <Text className="text-white">Parent or guardian needed</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 mt-4"
              onPress={() => setShowAgeRestrictionModal(false)}
            >
              <Text className="text-background text-center font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}