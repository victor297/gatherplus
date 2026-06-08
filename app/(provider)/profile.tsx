import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Home,
  Plus,
  User,
  Star,
  Bookmark,
  MapPin,
  Mail,
  Globe,
  Link,
  Phone,
  FileText,
  ImageIcon,
  MessageCircle,
  Edit3,
  ArrowBigRight,
  ChevronRight,
  X,
} from "lucide-react-native";
import {
  useCreateServiceMutation,
  useGetMediasQuery,
  useGetproviderdetailsQuery,
  useGetReviewsQuery,
  useUploadGalleryMutation,
} from "@/redux/api/providersApiSlice";
import { useSelector } from "react-redux";
import { formatDate, truncateSentence } from "@/utils";
import { RefreshControl } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUploadFileMutation } from "@/redux/api/usersApiSlice";

// Custom component for a Service Card
const ServiceCard = ({
  name,
  description,
  price,
  currency,
  priceType,
  images,
  service,
}) => {
  const router = useRouter();

  const handleEditService = () => {
    router.push({
      pathname: "/(provider)/update-service",
      params: { service: JSON.stringify(service) },
    });
  };

  return (
    <View className="flex-row items-center bg-card rounded-xl p-4 mb-3 bg-lightbackground shadow-md">
      {/* Service image */}
      {images && images.length > 0 ? (
        <Image
          source={{ uri: images[0] }}
          className="w-16 h-16 rounded-lg mr-4"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-lg bg-gray-600 mr-4"></View>
      )}
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">{name}</Text>
        <Text className="text-gray-500 text-sm">
          {truncateSentence(description)}
        </Text>
      </View>
      <View className="">
        <Text className="text-primary text-base font-bold">
          {currency} {price}
        </Text>
        <Text className="text-gray-500 text-sm mt-1 capitalize">{priceType}</Text>
      </View>
      <TouchableOpacity
        onPress={handleEditService}
        className="items-end bg-background p-1 ml-3 rounded-full"
      >
        <Edit3 className="text-primary text-base font-bold" />
      </TouchableOpacity>
    </View>
  );
};

// Custom component for a Gallery Image with delete option
const GalleryImage = ({ imageUrl, onRemove, index }) => (
  <View className="w-[30%] aspect-square bg-gray-700 rounded-lg m-[1.6%] overflow-hidden">
    <Image
      source={{ uri: imageUrl }}
      className="w-full h-full"
      resizeMode="cover"
    />
    {onRemove && (
      <TouchableOpacity
        onPress={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
      >
        <X size={16} color="white" />
      </TouchableOpacity>
    )}
  </View>
);

// Custom component for a Review Card
const ReviewCard = ({ content, rating, createdAt }) => {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 shadow-md">
      <View className="flex-row items-center mb-2">
        {/* Placeholder for user profile image */}
        <View className="w-10 h-10 rounded-full bg-gray-600 mr-3"></View>
        <View className="flex-1">
          <Text className="text-white text-base font-bold">Anonymous User</Text>
          <Text className="text-gray-500 text-xs">{formatDate(createdAt)}</Text>
        </View>
        <View className="flex-row items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              color={i < rating ? "#FFD700" : "#6B7280"}
              fill={i < rating ? "#FFD700" : "none"}
            />
          ))}
        </View>
      </View>
      <Text className="text-white text-sm">{content}</Text>
    </View>
  );
};

// Custom component for a Detail Item
const DetailItem = ({ icon: Icon, label, value }) => (
  <View className="flex-row items-center bg-lightbackground rounded-xl p-4 mb-3 shadow-md">
    <Icon size={20} color="#9EDD45" className="mr-3" />
    <View className="flex-1">
      <Text className="text-gray-500 text-xs">{label}</Text>
      <Text className="text-white text-base">{value || "Not provided"}</Text>
    </View>
  </View>
);

export default function ServiceDetails() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Services");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const { userInfo } = useSelector((state: any) => state.auth);

  // API hooks
  const [uploadFile] = useUploadFileMutation();
  const [uploadGallery] = useUploadGalleryMutation();

  const {
    data: providers,
    error: providersError,
    isLoading: isprovidersLoading,
    isFetching: isFetchingproviders,
    refetch: refetchproviders,
  } = useGetproviderdetailsQuery(userInfo?.sub, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const {
    data: medias,
    error: mediasError,
    isLoading: ismediasLoading,
    isFetching: isFetchingmedias,
    refetch: refetchmedias,
  } = useGetMediasQuery(userInfo?.sub, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const {
    data: reviewsData,
    error: reviewsError,
    isLoading: isreviewsLoading,
    isFetching: isFetchingreviews,
    refetch: refetchreviews,
  } = useGetReviewsQuery(userInfo?.sub);

  const reviews = reviewsData?.body || [];
  const providerData = providers?.body;

  // Handle image selection
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImages((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to select images");
    }
  };

  // Handle individual image upload
  const uploadSingleImage = async (imageAsset) => {
    try {
      const imageUri = imageAsset.uri;
      const fileName = imageUri.split("/").pop();
      const fileType = fileName?.split(".").pop() || "jpg";

      const formDataUpload = new FormData();
      formDataUpload.append("files", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      const response = await uploadFile(formDataUpload).unwrap();
      return response.body[0].secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  };

  // Handle gallery upload
  const handleUploadGallery = async () => {
    if (selectedImages.length === 0) return;

    setIsUploadingGallery(true);
    try {
      // Upload all selected images first
      const uploadPromises = selectedImages.map((image) =>
        uploadSingleImage(image)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      // Prepare gallery payload
      const galleryPayload = {
        medias: uploadedUrls.map((url) => ({
          mediaUrl: url,
          mediaType: "IMAGE",
          description: "Gallery image",
        })),
      };

      // Upload to gallery endpoint
      await uploadGallery(galleryPayload).unwrap();

      // Clear selected images and refresh provider data
      setSelectedImages([]);
      refetchproviders();
      refetchmedias();
      Alert.alert("Success", "Images uploaded successfully!");
    } catch (error) {
      console.error("Gallery upload failed:", error);
      Alert.alert("Error", "Failed to upload images");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Remove selected image
  const removeSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove gallery image (would need additional API call)
  const removeGalleryImage = async (index) => {
    // Implementation would require a delete endpoint
    Alert.alert("Info", "Image deletion would require a separate API endpoint");
  };

  // Combine all images for display
  const getAllImages = () => {
    const serviceImages =
      providerData?.services?.flatMap((service) => service.images) || [];
    const mediaImages = medias?.body?.flatMap((media) => media.mediaUrl) || [];
    console.log(mediaImages, "mediaImages");
    const profileImages = providerData?.profile_image
      ? [providerData.profile_image]
      : [];
    const coverImages = providerData?.cover_image
      ? [providerData.cover_image]
      : [];

    return [
      ...mediaImages,
      ...profileImages,
      ...coverImages,
      ...serviceImages,
    ].filter(Boolean);
  };

  const allImages = getAllImages();

  const renderContent = () => {
    switch (activeTab) {
      case "Services":
        return (
          <View className="p-4">
            {providerData?.services[0] ? (
              providerData?.services?.map((service) => (
                <ServiceCard
                  service={service}
                  key={service.id}
                  name={service.name}
                  description={service.description}
                  price={service.price}
                  currency={service.currency}
                  priceType={service.priceType}
                  images={service.images}
                />
              ))
            ) : (
              <View className="items-center justify-center p-6 rounded-lg bg-lightbackground mx-4">
                <FileText size={80} color="#6B7280" className="mb-4" />
                <Text className="text-white text-lg font-semibold text-center mb-2">
                  You haven&apos;t added any services yet
                </Text>
                <Text className="text-gray-400 text-sm text-center mb-6">
                  Showcase what you offer by adding your first service.
                </Text>
                <Pressable
                  onPress={() => router.push("/(provider)/create-service")}
                  className="flex-row items-center px-6 py-3 rounded-lg bg-primary"
                >
                  <Text className="text-background text-base font-semibold mr-2">
                    Add a Service
                  </Text>
                  <Plus size={20} color="#020E1E" />
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => router.push("/(provider)/create-service")}
              className="flex-row justify-end"
            >
              <Plus
                size={48}
                color="#020E1E"
                className="bg-primary items-start mt-6 rounded-full"
              />
            </Pressable>
          </View>
        );

      case "Gallery":
        return (
          <View className="flex-1">
            {/* Selected images preview */}
            {selectedImages.length > 0 && (
              <View className="p-4 border-b border-gray-700">
                <Text className="text-white text-lg font-bold mb-2">
                  Selected Images ({selectedImages.length})
                </Text>
                <View className="flex-row flex-wrap">
                  {selectedImages.map((image, index) => (
                    <GalleryImage
                      key={`selected-${index}`}
                      imageUrl={image.uri}
                      onRemove={removeSelectedImage}
                      index={index}
                    />
                  ))}
                </View>
                <Pressable
                  onPress={handleUploadGallery}
                  disabled={isUploadingGallery}
                  className="bg-primary rounded-lg p-3 mt-3 items-center"
                >
                  {isUploadingGallery ? (
                    <ActivityIndicator color="#020E1E" />
                  ) : (
                    <Text className="text-background font-bold">
                      Upload {selectedImages.length} Images
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Existing gallery images */}
            <View className="p-4">
              {allImages.length > 0 ? (
                <View className="flex-row flex-wrap">
                  {allImages.map((image, index) => (
                    <GalleryImage
                      key={`gallery-${index}`}
                      imageUrl={image}
                      onRemove={null}
                      index={index}
                    />
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center p-6 rounded-lg bg-lightbackground mx-4">
                  <ImageIcon size={80} color="#6B7280" className="mb-4" />
                  <Text className="text-white text-lg font-semibold text-center mb-2">
                    You haven&apos;t added any images yet
                  </Text>
                  <Text className="text-gray-400 text-sm text-center mb-6">
                    Showcase your work by uploading photos to your gallery
                  </Text>
                </View>
              )}
            </View>
            <Pressable onPress={pickImages} className="flex-row justify-end">
              <Plus
                size={48}
                color="#020E1E"
                className="bg-primary items-start mr-4 rounded-full"
              />
            </Pressable>
          </View>
        );

      case "Reviews":
        return (
          <View className="p-4">
            {reviews?.length > 0 ? (
              reviews?.map((review) => (
                <ReviewCard
                  key={review.id}
                  content={review.content}
                  rating={review.rating}
                  createdAt={review.created_at}
                />
              ))
            ) : (
              <Text className="text-white text-center py-10">
                No reviews yet
              </Text>
            )}
          </View>
        );
      case "Settings":
        return (
          <View className="p-2">
            {/* Business Info */}
            <View className="bg-card rounded-xl p-4 mb-4 shadow-md">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    {providerData?.business_name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {providerData?.address}, {providerData?.city}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {providerData?.country_code}
                  </Text>
                </View>
                {/* <View className="flex-row space-x-3">
                  <Bookmark size={20} color="white" />
                  <Share2 size={20} color="white" />
                </View> */}
              </View>

              {/* Contact Information */}
              {/* <DetailItem
                icon={Link}
                label="Working Hours"
                value={
                  workingHours
                    ? `${workingHours.open} - ${workingHours.close}`
                    : "Not available today"
                }
              /> */}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(provider)/working-hour",
                    params: {
                      workingHours: JSON.stringify(providerData?.WorkingHours),
                    },
                  })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="flex-row items-center border-primary bg-lightbackground rounded-xl p-4 mb-3 shadow-md">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">
                      {"view all Time Slot"}
                    </Text>
                    <Text className="text-white text-base">View Time Slot</Text>
                  </View>
                  <View>
                    <ChevronRight color="#6B7280" size={24} />
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(provider)/time-slot",
                    params: {
                      serviceparam: JSON.stringify(providerData?.services),
                    },
                  })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="flex-row items-center border-primary bg-lightbackground rounded-xl p-4 mb-3 shadow-md">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">
                      {"view all working hours"}
                    </Text>
                    <Text className="text-white text-base">
                      {"Working Hours"}
                    </Text>
                  </View>
                  <View>
                    <ChevronRight color="#6B7280" size={24} />
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(provider)/subscription",
                    params: {
                      subparam: JSON.stringify(providerData?.subscription),
                    },
                  })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="flex-row items-center border-primary bg-lightbackground rounded-xl p-4 mb-3 shadow-md">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">
                      {"View and Manage Subscriptions"}
                    </Text>
                    <Text className="text-white text-base">
                      {"Subscription"}
                    </Text>
                  </View>
                  <View>
                    <ChevronRight color="#6B7280" size={24} />
                  </View>
                </View>
              </Pressable>
              <DetailItem
                icon={Phone}
                label="Contact"
                value={providerData?.phone}
              />
              <DetailItem
                icon={MapPin}
                label="Location"
                value={`${providerData?.address}, ${providerData?.city}`}
              />
              <DetailItem
                icon={Mail}
                label="Email"
                value={providerData?.user?.profile?.email}
              />
              <DetailItem
                icon={Globe}
                label="Website"
                value={providerData?.website || "Not provided"}
              />
              <DetailItem
                icon={Link}
                label="Social Media"
                value={
                  providerData?.social_links
                    ? Object.entries(providerData.social_links)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")
                    : "Not provided"
                }
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetchingproviders}
            onRefresh={refetchproviders}
          />
        }
        className="flex-1"
      >
        {/* Header Section */}
        <View className="w-full h-56 relative">
          <Image
            source={{
              uri:
                providerData?.cover_image ||
                "https://www.shutterstock.com/image-photo/male-professional-touching-word-service-260nw-362467478.jpg",
            }}
            className="w-full h-full absolute top-0 left-0"
            resizeMode="cover"
          />
          <View className="absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center">
            <Pressable
              onPress={() => router.back()}
              className="p-2 rounded-full bg-gray-800/50"
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
          </View>

          <View className="absolute bottom-[-120] left-4 flex-col items-start">
            <View className="w-24 h-24 rounded-full border-4 border-background overflow-hidden">
              <Image
                source={{
                  uri:
                    providerData?.profile_image ||
                    "https://www.shutterstock.com/image-photo/male-professional-touching-word-service-260nw-362467478.jpg",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="ml-4 mb-2">
              <Text className="text-white text-xl font-bold">
                {providerData?.business_name}
              </Text>
              <Text className="text-gray-500 text-base">
                {providerData?.category?.name}
              </Text>
            </View>
          </View>

          {/* <View className="absolute bottom-[-70] right-4 flex-row space-x-3 items-center mb-2">
            <Pressable className="p-3 rounded-full bg-card">
              <Heart size={24} color="white" />
            </Pressable>
            <Pressable className="p-3 rounded-full bg-card">
              <Share2 size={24} color="white" />
            </Pressable>
            <Pressable className="bg-primary rounded-full px-6 py-3">
              <Text className="text-background font-bold text-base">
                Edit Profile
              </Text>
            </Pressable>
          </View> */}
        </View>

        {/* Spacer for profile image and buttons */}
        <View className="h-28"></View>

        {/* Tab Navigation */}
        <View className="flex-row justify-around border-b border-gray-700 bg-background pt-4">
          {["Services", "Gallery", "Reviews", "Settings"].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`py-3 px-4 ${
                activeTab === tab ? "border-b-2 border-primary" : ""
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  activeTab === tab ? "text-primary" : "text-gray-500"
                }`}
              >
                {tab}
                {tab === "Services" &&
                  ` (${providerData?.services?.length || 0})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
