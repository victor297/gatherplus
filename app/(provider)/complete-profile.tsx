import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons";
import {
  useCompleteProfileMutation,
  useGetPlansQuery,
  useGetservicecategoriesQuery,
} from "@/redux/api/providersApiSlice";
import {
  useGetCountriesQuery,
  useGetStatesQuery,
} from "@/redux/api/eventsApiSlice";
import { useGetCurrenciesQuery } from "@/redux/api/currencyAPI";
import { useUploadFileMutation } from "@/redux/api/usersApiSlice";

const steps = [
  "Basic Info",
  "Business Details",
  "Location & Pricing",
  "Subscription",
];

const ProfileCompletion = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    experience_years: "",
    price: "",
    priceType: "daily",
    currency: "",
    category_id: "",
    address: "",
    phone: "",
    zip_code: "",
    country_code: "",
    city: "",
    state_id: "",
    website: "",
    social_links: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
    subscription_plan: "",
  });

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPriceTypeModal, setShowPriceTypeModal] = useState(false);

  // Queries for dropdown data
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetservicecategoriesQuery({});

  const {
    data: countryData,
    isLoading: countryLoading,
    error: countryError,
  } = useGetCountriesQuery({});

  const {
    data: stateData,
    isLoading: stateLoading,
    error: stateError,
  } = useGetStatesQuery(selectedCountry?.code2, {
    skip: !selectedCountry,
  });

  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
  } = useGetCurrenciesQuery();

  const {
    data: plans,
    isLoading: isPlanLoading,
    error: planError,
  } = useGetPlansQuery({});

  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [completeProfile, { isLoading: isProfiling }] =
    useCompleteProfileMutation();

  // Filter data based on search query
  const filteredCountries = countryData?.body?.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStates = stateData?.body?.filter((state) =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCurrencies = currenciesData?.filter((currency) =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Watch country code to update states
  useEffect(() => {
    if (formData.country_code) {
      const country = countryData?.body?.find(
        (c) => c.code2 === formData.country_code
      );
      setSelectedCountry(country);
    }
  }, [formData.country_code, countryData]);

  // Handle image upload
  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "profile" ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const imageUri = result.assets[0].uri;
        const fileName = imageUri.split("/").pop();
        const fileType = fileName?.split(".").pop() || "jpg";

        const formDataUpload = new FormData();
        formDataUpload.append("files", {
          uri: imageUri,
          name: fileName,
          type: `image/${fileType}`,
        } as any);

        const response = await uploadFile(formDataUpload).unwrap();
        const imageUrl = response.body[0].secure_url;

        if (type === "profile") {
          setProfileImage(imageUrl);
        } else if (type === "cover") {
          setCoverImage(imageUrl);
        } else {
          setGalleryImages((prev) => [...prev, imageUrl]);
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const removeImage = (index, type) => {
    if (type === "profile") {
      setProfileImage(null);
    } else if (type === "cover") {
      setCoverImage(null);
    } else {
      const newImages = [...galleryImages];
      newImages.splice(index, 1);
      setGalleryImages(newImages);
    }
  };

  const handleInputChange = (name, value) => {
    if (name.includes("social_links")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (
          !formData.business_name ||
          !formData.category_id ||
          !formData.bio ||
          !formData.experience_years
        ) {
          Alert.alert("Required Fields", "Please fill all required fields");
          return false;
        }
        return true;
      case 1:
        if (!formData.phone || !formData.website) {
          Alert.alert("Required Fields", "Please fill all required fields");
          return false;
        }
        return true;
      case 2:
        if (
          !formData.country_code ||
          !formData.state_id ||
          !formData.city ||
          !formData.address ||
          !formData.price ||
          !formData.currency
        ) {
          Alert.alert("Required Fields", "Please fill all required fields");
          return false;
        }
        return true;
      case 3:
        if (!formData.subscription_plan) {
          Alert.alert("Required Field", "Please select a subscription plan");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const onSubmit = async () => {
    const finalData = {
      ...formData,
      profile_image: profileImage,
      cover_image: coverImage,
      //   gallery_images: galleryImages,
      languages_spoken: selectedLanguages,
      specialties: selectedSpecialties,
    };
    try {
      const response = await completeProfile(finalData).unwrap();
      router.push("/profile");
    } catch (error) {
      Alert.alert(error?.data?.message || "Something happened Truy again");
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Language and specialty options
  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Arabic",
    "Portuguese",
    "Russian",
    "Japanese",
    "Hindi",
    "Yoruba",
    "Igbo",
    "Hausa",
  ];

  const specialtyOptions = [
    "Wedding Photography",
    "Event Photography",
    "Videography",
    "Portrait Photography",
    "Commercial Photography",
    "Drone Photography",
    "Photo Editing",
    "Video Editing",
    "Live Streaming",
  ];

  const priceTypeOptions = [
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Monthly", value: "monthly" },
    { label: "Per Event", value: "per_event" },
  ];

  const toggleLanguage = (language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const toggleSpecialty = (specialty) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const addCustomLanguage = () => {
    if (
      customLanguage.trim() &&
      !selectedLanguages.includes(customLanguage.trim())
    ) {
      setSelectedLanguages([...selectedLanguages, customLanguage.trim()]);
      setCustomLanguage("");
    }
  };

  const addCustomSpecialty = () => {
    if (
      customSpecialty.trim() &&
      !selectedSpecialties.includes(customSpecialty.trim())
    ) {
      setSelectedSpecialties([...selectedSpecialties, customSpecialty.trim()]);
      setCustomSpecialty("");
    }
  };

  // Get plans for the selected country or default to US
  const getCountryPlans = () => {
    const countryCode = formData.country_code || "US";
    return plans?.body?.map((plan) => {
      const countryPlan =
        plan.countryPlans.find((cp) => cp.countryCode === countryCode) ||
        plan.countryPlans.find((cp) => cp.countryCode === "US");
      return {
        ...plan,
        displayPrice: countryPlan
          ? `${countryPlan.currency} ${countryPlan.price}`
          : `USD ${plan.price}`,
      };
    });
  };

  const countryPlans = getCountryPlans();

  // Modal component
  const SelectModal = ({
    visible,
    onClose,
    title,
    items,
    onSelect,
    selectedValue,
    displayKey = "name",
    searchable = false,
  }) => {
    const [localSearchQuery, setLocalSearchQuery] = useState("");

    const filteredItems = searchable
      ? items?.filter((item) =>
          (item[displayKey] || item.label)
            .toLowerCase()
            .includes(localSearchQuery.toLowerCase())
        )
      : items;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setLocalSearchQuery("");
          onClose();
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-4 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">{title}</Text>
              <Pressable
                onPress={() => {
                  setLocalSearchQuery("");
                  onClose();
                }}
              >
                <Feather name="x" size={24} color="white" />
              </Pressable>
            </View>

            {searchable && (
              <View className="mb-4">
                <TextInput
                  className="bg-gray-800 text-white p-3 rounded-lg"
                  placeholder="Search..."
                  placeholderTextColor="#6b7280"
                  value={localSearchQuery}
                  onChangeText={setLocalSearchQuery}
                  autoFocus={true}
                />
              </View>
            )}

            <FlatList
              data={filteredItems || []}
              keyExtractor={(item) =>
                item.value || item.id || item.code2 || item.code
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.value || item.id || item.code2 || item.code);
                    setLocalSearchQuery("");
                    onClose();
                  }}
                  className={`p-3 border-b border-gray-700 ${
                    (item.value || item.id || item.code2 || item.code) ===
                    selectedValue
                      ? "bg-primary/20"
                      : ""
                  }`}
                >
                  <Text
                    className={`${
                      (item.value || item.id || item.code2 || item.code) ===
                      selectedValue
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    {item[displayKey] || item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <View className="space-y-4">
            <Text className="text-white text-lg font-bold mb-2">
              Business Information
            </Text>

            <View>
              <Text className="text-gray-400 mb-1">Business Name*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) =>
                  handleInputChange("business_name", text)
                }
                value={formData.business_name}
                placeholder="Enter your business name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Business Category*</Text>
              {categoriesLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowCategoryModal(true)}
                    className="bg-background p-3 rounded-lg border border-gray-600"
                  >
                    <Text className="text-white">
                      {formData.category_id
                        ? categoriesData?.body?.find(
                            (c) => c.id === formData.category_id
                          )?.name
                        : "Select a category"}
                    </Text>
                  </Pressable>
                  <SelectModal
                    visible={showCategoryModal}
                    onClose={() => setShowCategoryModal(false)}
                    title="Select Category"
                    items={categoriesData?.body || []}
                    onSelect={(id) => {
                      handleInputChange("category_id", id);
                    }}
                    selectedValue={formData.category_id}
                  />
                </>
              )}
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Business Description*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg h-24 border border-gray-600"
                onChangeText={(text) => handleInputChange("bio", text)}
                value={formData.bio}
                placeholder="Tell us about your business..."
                placeholderTextColor="#6b7280"
                multiline
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Years of Experience*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) =>
                  handleInputChange("experience_years", Number(text))
                }
                value={formData.experience_years}
                placeholder="Enter years of experience"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Profile Image</Text>
              {profileImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: profileImage }}
                    className="w-32 h-32 rounded-full border border-gray-600"
                  />
                  <Pressable
                    onPress={() => removeImage(null, "profile")}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <Feather name="x" size={16} color="white" />
                  </Pressable>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => pickImage("profile")}
                  className="w-32 h-32 rounded-full bg-background border-2 border-dashed border-gray-600 justify-center items-center"
                >
                  <MaterialIcons name="add-a-photo" size={32} color="#9EDD45" />
                  <Text className="text-gray-400 mt-2">Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 1: // Business Details
        return (
          <View className="space-y-4">
            <Text className="text-white text-lg font-bold mb-2">
              Contact Information
            </Text>

            <View>
              <Text className="text-gray-400 mb-1">Phone Number*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) => handleInputChange("phone", text)}
                value={formData.phone}
                placeholder="Enter phone number"
                placeholderTextColor="#6b7280"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Website*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) => handleInputChange("website", text)}
                value={formData.website}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#6b7280"
                keyboardType="url"
              />
            </View>

            <Text className="text-white text-lg font-bold mt-6 mb-2">
              Social Media
            </Text>

            <View>
              <Text className="text-gray-400 mb-1">Instagram</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) =>
                  handleInputChange("social_links.instagram", text)
                }
                value={formData.social_links.instagram}
                placeholder="@username"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Facebook</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) =>
                  handleInputChange("social_links.facebook", text)
                }
                value={formData.social_links.facebook}
                placeholder="facebook.com/username"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Twitter/X</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) =>
                  handleInputChange("social_links.twitter", text)
                }
                value={formData.social_links.twitter}
                placeholder="@username"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Cover Image</Text>
              {coverImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: coverImage }}
                    className="w-full h-40 rounded-lg border border-gray-600"
                  />
                  <Pressable
                    onPress={() => removeImage(null, "cover")}
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                  >
                    <Feather name="x" size={16} color="white" />
                  </Pressable>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => pickImage("cover")}
                  className="w-full h-40 rounded-lg bg-background border-2 border-dashed border-gray-600 justify-center items-center"
                >
                  <MaterialIcons name="add-a-photo" size={32} color="#9EDD45" />
                  <Text className="text-gray-400 mt-2">Add Cover Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 2: // Location & Pricing
        return (
          <View className="space-y-4">
            <Text className="text-white text-lg font-bold mb-2">
              Business Location
            </Text>

            <View>
              <Text className="text-gray-400 mb-1">Country*</Text>
              {countryLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      setSearchQuery("");
                      setShowCountryModal(true);
                    }}
                    className="bg-background p-3 rounded-lg border border-gray-600"
                  >
                    <Text className="text-white">
                      {formData.country_code
                        ? countryData?.body?.find(
                            (c) => c.code2 === formData.country_code
                          )?.name
                        : "Select a country"}
                    </Text>
                  </Pressable>
                  <SelectModal
                    visible={showCountryModal}
                    onClose={() => setShowCountryModal(false)}
                    title="Select Country"
                    items={countryData?.body || []}
                    onSelect={(code) => {
                      handleInputChange("country_code", code);
                    }}
                    selectedValue={formData.country_code}
                    searchable={true}
                  />
                </>
              )}
            </View>

            <View>
              <Text className="text-gray-400 mb-1">State/Region*</Text>
              {stateLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Pressable
                    onPress={() => {
                      if (selectedCountry) {
                        setSearchQuery("");
                        setShowStateModal(true);
                      }
                    }}
                    className={`bg-background p-3 rounded-lg border ${
                      !selectedCountry ? "border-gray-700" : "border-gray-600"
                    }`}
                    disabled={!selectedCountry}
                  >
                    <Text
                      className={`${
                        !selectedCountry ? "text-gray-500" : "text-white"
                      }`}
                    >
                      {!selectedCountry
                        ? "Select country first"
                        : formData.state_id
                        ? stateData?.body?.find(
                            (s) => s.id === formData.state_id
                          )?.name
                        : "Select a state"}
                    </Text>
                  </Pressable>
                  <SelectModal
                    visible={showStateModal}
                    onClose={() => setShowStateModal(false)}
                    title="Select State"
                    items={stateData?.body || []}
                    onSelect={(id) => {
                      handleInputChange("state_id", id);
                    }}
                    selectedValue={formData.state_id}
                    searchable={true}
                  />
                </>
              )}
            </View>

            <View>
              <Text className="text-gray-400 mb-1">City*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) => handleInputChange("city", text)}
                value={formData.city}
                placeholder="Enter your city"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Address*</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) => handleInputChange("address", text)}
                value={formData.address}
                placeholder="Enter your business address"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Zip/Postal Code</Text>
              <TextInput
                className="bg-background text-white p-3 rounded-lg border border-gray-600"
                onChangeText={(text) => handleInputChange("zip_code", text)}
                value={formData.zip_code}
                placeholder="Enter zip/postal code"
                placeholderTextColor="#6b7280"
              />
            </View>

            <Text className="text-white text-lg font-bold mt-6 mb-2">
              Pricing Information
            </Text>

            <View>
              <Text className="text-gray-400 mb-1">Base Price*</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="bg-background text-white p-3 rounded-lg flex-1 border border-gray-600"
                  onChangeText={(text) =>
                    handleInputChange("price", Number(text))
                  }
                  value={formData.price}
                  placeholder="Enter your base price"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
                <View className="ml-2">
                  <Pressable
                    onPress={() => {
                      setSearchQuery("");
                      setShowCurrencyModal(true);
                    }}
                    className="bg-background p-3 rounded-lg border border-gray-600 w-24"
                  >
                    <Text className="text-white" numberOfLines={1}>
                      {formData.currency || "Currency*"}
                    </Text>
                  </Pressable>
                  <SelectModal
                    visible={showCurrencyModal}
                    onClose={() => setShowCurrencyModal(false)}
                    title="Select Currency"
                    items={currenciesData || []}
                    onSelect={(code) => {
                      handleInputChange("currency", code);
                    }}
                    selectedValue={formData.currency}
                    searchable={true}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="text-gray-400 mb-1">Price Type</Text>
              <Pressable
                onPress={() => setShowPriceTypeModal(true)}
                className="bg-background p-3 rounded-lg border border-gray-600"
              >
                <Text className="text-white">
                  {priceTypeOptions.find(
                    (opt) => opt.value === formData.priceType
                  )?.label || "Select price type"}
                </Text>
              </Pressable>
              <SelectModal
                visible={showPriceTypeModal}
                onClose={() => setShowPriceTypeModal(false)}
                title="Select Price Type"
                items={priceTypeOptions}
                onSelect={(value) => {
                  handleInputChange("priceType", value);
                }}
                selectedValue={formData.priceType}
                displayKey="label"
              />
            </View>
            {/* Languages Spoken Section */}
            <Text className="text-white text-lg font-bold mt-6 mb-2">
              Languages Spoken
            </Text>
            <View className="flex-row flex-wrap">
              {languageOptions.map((language) => (
                <TouchableOpacity
                  key={language}
                  onPress={() => toggleLanguage(language)}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                    selectedLanguages.includes(language)
                      ? "bg-primary border-primary"
                      : "bg-background border-gray-600"
                  }`}
                >
                  <Text
                    className={`${
                      selectedLanguages.includes(language)
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Show selected custom languages */}
              {selectedLanguages
                .filter((lang) => !languageOptions.includes(lang))
                .map((language, index) => (
                  <TouchableOpacity
                    key={`custom-${index}`}
                    onPress={() => toggleLanguage(language)}
                    className="px-3 py-2 rounded-full mr-2 mb-2 bg-primary border border-primary"
                  >
                    <Text className="text-white">{language}</Text>
                  </TouchableOpacity>
                ))}
            </View>
            <View className="flex-row items-center mt-2">
              <TextInput
                className="bg-background text-white p-3 rounded-lg flex-1 border border-gray-600"
                value={customLanguage}
                onChangeText={setCustomLanguage}
                placeholder="Add custom language"
                placeholderTextColor="#6b7280"
                onSubmitEditing={addCustomLanguage} // Add on submit
              />
              <TouchableOpacity
                onPress={addCustomLanguage}
                className="ml-2 bg-primary p-3 rounded-lg"
              >
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
            </View>

            {/* Specialties Section */}
            <Text className="text-white text-lg font-bold mt-6 mb-2">
              Specialties
            </Text>
            <View className="flex-row flex-wrap">
              {specialtyOptions.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 border ${
                    selectedSpecialties.includes(specialty)
                      ? "bg-primary border-primary"
                      : "bg-background border-gray-600"
                  }`}
                >
                  <Text
                    className={`${
                      selectedSpecialties.includes(specialty)
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Show selected custom specialties */}
              {selectedSpecialties
                .filter((spec) => !specialtyOptions.includes(spec))
                .map((specialty, index) => (
                  <TouchableOpacity
                    key={`custom-${index}`}
                    onPress={() => toggleSpecialty(specialty)}
                    className="px-3 py-2 rounded-full mr-2 mb-2 bg-primary border border-primary"
                  >
                    <Text className="text-white">{specialty}</Text>
                  </TouchableOpacity>
                ))}
            </View>
            <View className="flex-row items-center mt-2">
              <TextInput
                className="bg-background text-white p-3 rounded-lg flex-1 border border-gray-600"
                value={customSpecialty}
                onChangeText={setCustomSpecialty}
                placeholder="Add custom specialty"
                placeholderTextColor="#6b7280"
                onSubmitEditing={addCustomSpecialty} // Add on submit
              />
              <TouchableOpacity
                onPress={addCustomSpecialty}
                className="ml-2 bg-primary p-3 rounded-lg"
              >
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-white text-lg font-bold mt-6 mb-2">
                Gallery Images
              </Text>
              <View className="flex-row flex-wrap">
                {galleryImages.map((image, index) => (
                  <View key={index} className="w-1/3 p-1">
                    <View className="relative">
                      <Image
                        source={{ uri: image }}
                        className="w-full h-32 rounded-lg border border-gray-600"
                      />
                      <Pressable
                        onPress={() => removeImage(index, "gallery")}
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                      >
                        <Feather name="x" size={12} color="white" />
                      </Pressable>
                    </View>
                  </View>
                ))}
                {galleryImages.length < 6 && (
                  <TouchableOpacity
                    onPress={() => pickImage("gallery")}
                    className="w-1/3 p-1"
                  >
                    <View className="w-full h-32 rounded-lg bg-background border-2 border-dashed border-gray-600 justify-center items-center">
                      <MaterialIcons
                        name="add-a-photo"
                        size={24}
                        color="#9EDD45"
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );

      case 3: // Subscription
        return (
          <View className="space-y-4">
            <Text className="text-white text-lg font-bold mb-4">
              Choose a Subscription Plan
            </Text>

            {isPlanLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <View className="space-y-3">
                {countryPlans?.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() =>
                      handleInputChange("subscription_plan", plan.id)
                    }
                    className={`p-4 rounded-lg border-2 ${
                      formData.subscription_plan === plan.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-600 bg-background"
                    }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text
                        className={`text-lg font-bold ${
                          formData.subscription_plan === plan.id
                            ? "text-primary"
                            : "text-white"
                        }`}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        className={`text-lg ${
                          formData.subscription_plan === plan.id
                            ? "text-primary"
                            : "text-gray-400"
                        }`}
                      >
                        {plan.displayPrice}/{plan.frequency.toLowerCase()}
                      </Text>
                    </View>
                    <Text
                      className={`mt-2 ${
                        formData.subscription_plan === plan.id
                          ? "text-primary"
                          : "text-gray-400"
                      }`}
                    >
                      {plan.description}
                    </Text>
                    {formData.subscription_plan === plan.id && (
                      <View className="mt-2 flex-row items-center">
                        <Feather
                          name="check-circle"
                          size={16}
                          color="#9EDD45"
                        />
                        <Text className="text-primary ml-2">Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text className="text-gray-400 text-sm mt-4">
              Your subscription will automatically renew each month. You can
              cancel anytime.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        {/* Progress Steps */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold mb-4">
            Complete Your Profile ({currentStep + 1}/{steps.length})
          </Text>

          <View className="flex-row justify-between mb-2">
            {steps.map((step, index) => (
              <View
                key={index}
                className={`flex-1 items-center ${
                  index !== steps.length - 1 ? "mr-2" : ""
                }`}
              >
                <View
                  className={`w-8 h-8 rounded-full justify-center items-center border ${
                    index <= currentStep
                      ? "bg-primary border-primary"
                      : "bg-background border-gray-600"
                  }`}
                >
                  <Text className="text-white font-bold">{index + 1}</Text>
                </View>
                <Text
                  className={`text-xs mt-1 text-center ${
                    index === currentStep ? "text-primary" : "text-gray-400"
                  }`}
                  numberOfLines={1}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row h-1 bg-background rounded-full mt-2 border border-gray-600">
            <View
              className="h-1 bg-primary rounded-full"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Current Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <View className="flex-row justify-between mt-8 mb-4">
          {currentStep > 0 ? (
            <TouchableOpacity
              onPress={prevStep}
              className="bg-background py-3 px-6 rounded-lg border border-gray-600"
            >
              <Text className="text-white">Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              onPress={nextStep}
              className="bg-primary py-3 px-6 rounded-lg"
            >
              <Text className="text-background font-bold">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onSubmit}
              className="bg-primary py-3 px-6 rounded-lg"
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-background font-bold">
                  Complete Profile
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileCompletion;
