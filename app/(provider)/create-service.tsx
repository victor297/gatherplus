import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  DollarSign,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  useGetservicecategoriesQuery,
  useCreateServiceMutation,
} from "@/redux/api/providersApiSlice";
import * as ImagePicker from "expo-image-picker";
import { useUploadFileMutation } from "@/redux/api/usersApiSlice";
import { useGetCurrenciesQuery } from "@/redux/api/currencyAPI";
import { useRouter } from "expo-router";

export default function CreateService() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "USD",
    category_id: "",
    price: "",
    priceType: "hourly",
    duration: "",
    durationUnit: "minutes", // 'minutes' or 'hours'
    images: [] as string[],
  });

  // State for UI
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isPriceTypeModalVisible, setPriceTypeModalVisible] = useState(false);
  const [isDurationUnitModalVisible, setDurationUnitModalVisible] =
    useState(false);
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetservicecategoriesQuery({});

  // Fetch currencies
  const {
    data: currenciesData,
    isLoading: currenciesLoading,
    error: currenciesError,
  } = useGetCurrenciesQuery();

  // Image upload
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  // Options for dropdowns
  const priceTypeOptions = ["hourly", "daily", "fixed"];
  const durationUnitOptions = ["minutes", "hours"];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uploadedImages = [];

        for (const asset of result.assets) {
          const imageUri = asset.uri;
          const fileName = imageUri.split("/").pop();
          const fileType = fileName?.split(".").pop() || "jpg";

          const formDataUpload = new FormData();
          formDataUpload.append("files", {
            uri: imageUri,
            name: fileName,
            type: `image/${fileType}`,
          } as any);

          const response = await uploadFile(formDataUpload).unwrap();
          uploadedImages.push(response.body[0].secure_url);
        }

        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedImages],
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload images");
      console.error(error);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.price ||
      !formData.category_id ||
      !formData.duration
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // Convert duration to minutes based on selected unit
    let durationInMinutes = parseFloat(formData.duration);
    if (formData.durationUnit === "hours") {
      durationInMinutes = durationInMinutes * 60;
    }

    // Prepare payload
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      duration: Number(durationInMinutes),
      // Remove durationUnit from payload as backend expects only duration in minutes
      //   durationUnit: undefined,
    };
    try {
      await createService(payload).unwrap();

      Alert.alert("Success", "Service created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error1", "Error Creating Service");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-8">
      <StatusBar style="light" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            Create Service
          </Text>
        </View>

        {/* Form Fields */}
        <View className="px-4 py-2">
          {/* Service Name */}
          <Text className="text-white text-base font-semibold mb-2">
            Service Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-lightbackground text-white rounded-lg p-3 text-base mb-4"
            placeholder="Enter service name"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          {/* Service Description */}
          <Text className="text-white text-base font-semibold mb-2">
            Service Description
          </Text>
          <TextInput
            className="bg-lightbackground text-white rounded-lg p-3 text-base h-28 mb-4"
            placeholder="Enter description"
            placeholderTextColor="#9CA3AF"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />

          {/* Category */}
          <Text className="text-white text-base font-semibold mb-2">
            Category <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between bg-lightbackground rounded-lg p-3 mb-4"
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text className="text-white text-base">
              {formData.category_id
                ? categoriesData?.body.find(
                    (c) => c.id === parseInt(formData.category_id)
                  )?.name
                : "Select category"}
            </Text>
            <ChevronDown size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Price Type */}
          <Text className="text-white text-base font-semibold mb-2">
            Price Type
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-between bg-lightbackground rounded-lg p-3 mb-4"
            onPress={() => setPriceTypeModalVisible(true)}
          >
            <Text className="text-white text-base capitalize">
              {formData.priceType}
            </Text>
            <ChevronDown size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Duration */}
          <Text className="text-white text-base font-semibold mb-2">
            Duration (in minutes) <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center bg-lightbackground rounded-lg mb-4">
            <TextInput
              className="flex-1 text-white text-base p-3"
              placeholder="Enter duration"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={formData.duration}
              onChangeText={(text) => handleInputChange("duration", text)}
            />
            <TouchableOpacity
              className="flex-row items-center p-3 border-l border-[#3A3A50]"
              onPress={() => setDurationUnitModalVisible(true)}
            >
              <Text className="text-white text-base capitalize mr-1">
                {formData.durationUnit}
              </Text>
              <ChevronDown size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text className="text-white text-base font-semibold mb-2">
            Price <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center bg-lightbackground rounded-lg mb-4">
            <TouchableOpacity
              className="flex-row items-center p-3 border-r border-[#3A3A50]"
              onPress={() => setCurrencyModalVisible(true)}
            >
              <DollarSign size={20} color="#FFFFFF" />
              <Text className="text-white text-base ml-1">
                {formData.currency}
              </Text>
              <ChevronDown size={16} color="#9CA3AF" className="ml-1" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 text-white text-base p-3"
              placeholder="Enter price"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(text) => handleInputChange("price", text)}
            />
          </View>

          {/* Add Banner Section */}
          <View className="bg-lightbackground rounded-lg p-6 items-center justify-center mb-6">
            {formData.images.length > 0 ? (
              <View className="w-full">
                <ScrollView horizontal className="mb-4">
                  {formData.images.map((uri, index) => (
                    <View key={index} className="relative mr-2">
                      <Image
                        source={{ uri }}
                        className="w-20 h-20 rounded-lg"
                      />
                      <TouchableOpacity
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        onPress={() => removeImage(index)}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  className="flex-row items-center bg-primary rounded-full px-5 py-3 justify-center"
                  onPress={handleSelectImages}
                  disabled={isUploading}
                >
                  <Text className="text-white font-semibold text-base mr-2">
                    {isUploading ? "Uploading..." : "Add More Images"}
                  </Text>
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className="w-20 h-20 rounded-full bg-[#3A3A50] items-center justify-center mb-3">
                  <Text className="text-white text-4xl">🖼️</Text>
                </View>
                <Text className="text-gray-400 text-sm mb-4">png, jpeg</Text>
                <TouchableOpacity
                  className="flex-row items-center bg-primary rounded-full px-5 py-3"
                  onPress={handleSelectImages}
                  disabled={isUploading}
                >
                  <Text className="text-white font-semibold text-base mr-2">
                    {isUploading ? "Uploading..." : "Add Banner"}
                  </Text>
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-background">
        <TouchableOpacity
          className="bg-primary rounded-full py-4 items-center justify-center shadow-md"
          onPress={handleSubmit}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-white text-lg font-bold">Create Service</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-lightbackground rounded-lg p-6 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-60">
              {categoriesData?.body.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className="py-3 border-b border-[#3A3A50] last:border-b-0"
                  onPress={() => {
                    handleInputChange("category_id", category.id.toString());
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text className="text-white text-base">{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Price Type Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPriceTypeModalVisible}
        onRequestClose={() => setPriceTypeModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-lightbackground rounded-lg p-6 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Select Price Type
              </Text>
              <TouchableOpacity onPress={() => setPriceTypeModalVisible(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-60">
              {priceTypeOptions.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  className="py-3 border-b border-[#3A3A50] last:border-b-0"
                  onPress={() => {
                    handleInputChange("priceType", type);
                    setPriceTypeModalVisible(false);
                  }}
                >
                  <Text className="text-white text-base capitalize">
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Duration Unit Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDurationUnitModalVisible}
        onRequestClose={() => setDurationUnitModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-lightbackground rounded-lg p-6 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Select Duration Unit
              </Text>
              <TouchableOpacity
                onPress={() => setDurationUnitModalVisible(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-60">
              {durationUnitOptions.map((unit, index) => (
                <TouchableOpacity
                  key={index}
                  className="py-3 border-b border-[#3A3A50] last:border-b-0"
                  onPress={() => {
                    handleInputChange("durationUnit", unit);
                    setDurationUnitModalVisible(false);
                  }}
                >
                  <Text className="text-white text-base capitalize">
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCurrencyModalVisible}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-lightbackground rounded-lg p-6 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Select Currency
              </Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-60">
              {currenciesData?.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  className="py-3 border-b border-[#3A3A50] last:border-b-0"
                  onPress={() => {
                    handleInputChange("currency", currency.code);
                    setCurrencyModalVisible(false);
                  }}
                >
                  <Text className="text-white text-base">
                    {currency.code} - {currency.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
