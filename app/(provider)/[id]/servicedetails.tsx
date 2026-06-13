import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Plus,
  Star,
  Bookmark,
  MapPin,
  Mail,
  Globe,
  Link,
  Phone,
  X,
  FileText,
} from "lucide-react-native";
import {
  useCreateChatMutation,
  useCreateReviewMutation,
  useGetMediasQuery,
  useGetproviderdetailsQuery,
  useGetReviewsQuery,
} from "@/redux/api/providersApiSlice";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { formatDate, truncateSentence } from "@/utils";
import { useSelector } from "react-redux";
import { RefreshControl } from "react-native";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Custom component for a Service Card
const ServiceCard = ({
  name,
  description,
  price,
  currency,
  priceType,
  images,
  id,
  profile,
}) => {
  const router = useRouter();
  const { requireAuth } = useAuthCheck();

  return (
    <Pressable
      onPress={() => {
        if (!requireAuth()) return;
        router.push({
          pathname: `/(provider)/${id}/make-appointment` as RelativePathString,
          params: {
            profile: JSON.stringify(profile),
          },
        });
      }}
      className="mb-3 overflow-hidden rounded-2xl border border-[#243044] bg-[#111823]"
    >
      {images && images.length > 0 ? (
        <Image
          source={{ uri: images[0] }}
          className="h-36 w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-36 w-full bg-[#1A2432] items-center justify-center">
          <FileText size={28} color="#9EDD45" />
        </View>
      )}
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-white text-lg font-black" numberOfLines={1}>
              {name}
            </Text>
            <Text className="mt-1 text-gray-400 text-sm" numberOfLines={2}>
              {truncateSentence(description)}
            </Text>
          </View>
          <View className="rounded-full bg-primary px-3 py-2">
            <Text className="text-background text-xs font-black">
              Book
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center justify-between border-t border-[#243044] pt-3">
          <Text className="text-primary text-base font-black">
            {currency} {price}
          </Text>
          <Text className="text-gray-400 text-sm capitalize">
            {priceType}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// Custom component for a Gallery Image
const GalleryImage = ({ imageUrl }) => (
  <View className="w-[31%] aspect-square bg-[#1A2432] rounded-2xl mb-3 overflow-hidden">
    <Image
      source={{ uri: imageUrl }}
      className="w-full h-full"
      resizeMode="cover"
    />
  </View>
);

// Custom component for a Review Card
const ReviewCard = ({ content, rating, createdAt }) => {
  return (
    <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-3">
      <View className="flex-row items-center mb-2">
        <View className="w-10 h-10 rounded-full bg-primary/15 mr-3 items-center justify-center">
          <Star size={16} color="#9EDD45" />
        </View>
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

// Review Modal Component
const ReviewModal = ({ visible, onClose, onSubmit, isLoading }) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content || rating === 0) {
      Alert.alert("Error", "Please provide both a rating and review text");
      return;
    }
    onSubmit({ content, rating });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/90 p-4">
        <View className="w-full bg-card rounded-xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Add Review</Text>
            <Pressable onPress={onClose}>
              <X size={24} color="white" />
            </Pressable>
          </View>

          <Text className="text-white mb-2">Rating</Text>
          <View className="flex-row mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Star
                  size={32}
                  color={star <= rating ? "#FFD700" : "#6B7280"}
                  fill={star <= rating ? "#FFD700" : "none"}
                  className="mr-2"
                />
              </Pressable>
            ))}
          </View>

          <Text className="text-white mb-2">Review</Text>
          <TextInput
            className="bg-gray-700 rounded-lg p-4 text-white mb-6 h-32"
            placeholder="Write your review here..."
            placeholderTextColor="#6B7280"
            multiline
            value={content}
            onChangeText={setContent}
          />

          <Pressable
            className="bg-primary rounded-lg p-4 items-center justify-center"
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-background font-bold">Submit Review</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Contact Modal Component
const ContactModal = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  businessName,
  message,
  setMessage,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/90 p-4">
        <View className="w-full bg-card rounded-xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">
              Contact Service Professional
            </Text>
            <Pressable onPress={onClose}>
              <X size={24} color="white" />
            </Pressable>
          </View>

          <Text className="text-white mb-2">
            Send a message to {businessName}
          </Text>
          <TextInput
            className="bg-gray-700 rounded-lg p-4 text-white mb-6 h-32"
            placeholder="Type your message here..."
            placeholderTextColor="#6B7280"
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <Pressable
            className="bg-primary rounded-lg p-4 items-center justify-center"
            onPress={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-background font-bold">Send Message</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Custom component for a Detail Item
const DetailItem = ({ icon: Icon, label, value }) => (
  <View className="flex-row items-center bg-[#111823] border border-[#243044] rounded-2xl p-4 mb-3">
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
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const { userInfo, requireAuth } = useAuthCheck();

  const { id } = useLocalSearchParams();
  const {
    data: providers,
    error: providersError,
    isLoading: isprovidersLoading,
    isFetching: isFetchingproviders,
    refetch: refetchproviders,
  } = useGetproviderdetailsQuery(id);
  const {
    data: medias,
    error: mediasError,
    isLoading: ismediasLoading,
    isFetching: isFetchingmedias,
    refetch: refetchmedias,
  } = useGetMediasQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [createReview, { isLoading: isCreatingReview }] =
    useCreateReviewMutation();

  // Combine all images for display

  const {
    data: reviewsData,
    error: reviewsError,
    isLoading: isreviewsLoading,
    isFetching: isFetchingreviews,
    refetch: refetchreviews,
  } = useGetReviewsQuery(id);
  const [createChat, { isLoading: isSending }] = useCreateChatMutation();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await createChat({
        provider_user_id: Number(id),
        user_id: Number(userInfo?.sub),
        message: message,
        sender: "PROVIDER",
        is_reply: true,
      }).unwrap();

      setMessage("");
      setContactModalVisible(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const handleSubmitReview = async ({ content, rating }) => {
    try {
      await createReview({
        provider_id: Number(id),
        user_id: userInfo?.sub,
        content,
        rating,
      }).unwrap();
      setReviewModalVisible(false);
      refetchreviews();
    } catch (error) {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    }
  };

  if (isprovidersLoading || isFetchingproviders) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <View className="text-white flex items-center py-4">
          <ActivityIndicator color="#9EDD45" />
        </View>
      </SafeAreaView>
    );
  }

  if (providersError) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-white">Error loading provider details</Text>
      </SafeAreaView>
    );
  }

  const providerData = providers?.body;
  const workingHours = providerData?.WorkingHours?.find(
    (day) => day.day === new Date().toLocaleString("en-US", { weekday: "long" })
  );

  const reviews = reviewsData?.body || [];

  const renderContent = () => {
    switch (activeTab) {
      case "Services":
        return (
          <View className="p-4">
            {providerData?.services?.length >= 1 ? (
              providerData?.services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  price={service.price}
                  currency={service.currency}
                  priceType={service.priceType}
                  images={service.images}
                  profile={providers?.body?.user?.profile}
                />
              ))
            ) : (
              <View className="items-center justify-center p-6 rounded-lg bg-lightbackground mx-4">
                <FileText size={80} color="#6B7280" className="mb-4" />
                <Text className="text-white text-lg font-semibold text-center mb-2">
                  No service Available
                </Text>
                <Text className="text-gray-400 text-sm text-center mb-6">
                  Check back later
                </Text>
              </View>
            )}
          </View>
        );
      case "Gallery":
        const getAllImages = () => {
          const serviceImages =
            providerData?.services?.flatMap((service) => service.images) || [];
          const mediaImages =
            medias?.body?.flatMap((media) => media.mediaUrl) || [];
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

        return (
          <View className="flex-row flex-wrap justify-between p-4">
            {allImages.length > 0 ? (
              allImages.map((image, index) => (
                <GalleryImage key={index} imageUrl={image} />
              ))
            ) : (
              <Text className="text-white w-full text-center py-10">
                No images available
              </Text>
            )}
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
              <View className="py-10 flex flex-col justify-center items-center">
                <Text className="text-white text-center ">No reviews yet</Text>
                <Pressable
                  onPress={() => {
                    if (requireAuth()) setReviewModalVisible(true)
                  }}
                  className=" py-2 px-4 rounded-xl mt-4 bg-primary"
                >
                  <Text className="text-white text-center">+ Add Review</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => {
                if (requireAuth()) setReviewModalVisible(true)
              }}
              className="flex-row justify-end"
            >
              <View className="bg-primary p-3 rounded-full mt-6">
                <Plus size={24} color="#020E1E" />
              </View>
            </Pressable>
          </View>
        );
      case "Details":
        return (
          <View className="p-4">
            <View className="bg-card rounded-xl  mb-4 shadow-md">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    {providerData?.business_name ||
                      "Business name not provided"}
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

              <View className="flex-row justify-between mb-4">
                {[providerData?.profile_image, providerData?.cover_image].map(
                  (image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      className="w-[32%] h-20 rounded-lg"
                      resizeMode="cover"
                    />
                  )
                )}
                <Pressable
                  onPress={() => setActiveTab("Gallery")}
                  className="w-[32%] h-20 rounded-lg bg-gray-700 justify-center items-center"
                >
                  <Text className="text-gray-500 text-xs">More</Text>
                </Pressable>
              </View>

              <View className="w-full h-40 bg-gray-700 rounded-lg justify-center items-center mb-4">
                <MapPin size={30} color="#9EDD45" fill="#9EDD45" />
                <Text className="text-white mt-2">
                  {providerData?.address}, {providerData?.city}
                </Text>
              </View>

              <DetailItem
                icon={Link}
                label="Working Hours"
                value={
                  workingHours
                    ? `${workingHours.open} - ${workingHours.close}`
                    : "Not available today"
                }
              />
              <DetailItem
                icon={Phone}
                label="Contact"
                value={providerData?.phone}
              />
              <DetailItem
                icon={MapPin}
                label="Location"
                value={`${providerData?.address || "State Not provided"}, ${
                  providerData?.city || "City Not provided"
                }`}
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
        <View className="relative">
          <View className="h-64 bg-[#111823]">
            <Image
              source={{
                uri:
                  providerData?.cover_image ||
                  providerData?.profile_image ||
                  "https://www.shutterstock.com/image-photo/male-professional-touching-word-service-260nw-362467478.jpg",
              }}
              className="h-full w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/40" />
            <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full bg-black/55"
                onPress={() => router.back()}
              >
                <ArrowLeft size={22} color="white" />
              </Pressable>
              <Pressable
                className="rounded-full bg-primary px-5 py-3"
                onPress={() => {
                  if (requireAuth()) setContactModalVisible(true);
                }}
              >
                <Text className="text-background font-black">Contact</Text>
              </Pressable>
            </View>
          </View>

          <View className="-mt-16 px-4">
            <View className="rounded-2xl border border-[#243044] bg-[#111823] p-4">
              <View className="flex-row items-start">
                <View className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#243044] bg-[#1A2432]">
                  <Image
                    source={{
                      uri:
                        providerData?.profile_image ||
                        providerData?.cover_image ||
                        "https://www.shutterstock.com/image-photo/male-professional-touching-word-service-260nw-362467478.jpg",
                    }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white text-2xl font-black" numberOfLines={2}>
                    {providerData?.business_name || "Event professional"}
                  </Text>
                  <Text className="mt-1 text-gray-400" numberOfLines={1}>
                    {providerData?.category?.name || "Planner and event service provider"}
                  </Text>
                  <View className="mt-3 flex-row items-center">
                    <MapPin size={15} color="#9EDD45" />
                    <Text className="ml-2 flex-1 text-gray-300 text-sm" numberOfLines={1}>
                      {[providerData?.address, providerData?.city]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="mt-4 flex-row">
                <View className="mr-2 flex-1 rounded-2xl bg-[#1A2432] p-3">
                  <Text className="text-white text-lg font-black">
                    {providerData?.services?.length || 0}
                  </Text>
                  <Text className="mt-1 text-gray-400 text-xs">Services</Text>
                </View>
                <View className="mx-1 flex-1 rounded-2xl bg-[#1A2432] p-3">
                  <Text className="text-white text-lg font-black">
                    {reviews.length || 0}
                  </Text>
                  <Text className="mt-1 text-gray-400 text-xs">Reviews</Text>
                </View>
                <View className="ml-2 flex-1 rounded-2xl bg-[#1A2432] p-3">
                  <Text className="text-primary text-lg font-black">
                    {workingHours ? "Open" : "Check"}
                  </Text>
                  <Text className="mt-1 text-gray-400 text-xs">Today</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row rounded-2xl border border-[#243044] bg-[#111823] p-1">
              {["Services", "Gallery", "Reviews", "Details"].map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`rounded-xl px-4 py-3 ${
                    activeTab === tab ? "bg-primary" : ""
                  }`}
                >
                  <Text
                    className={`font-black ${
                      activeTab === tab ? "text-background" : "text-gray-400"
                    }`}
                  >
                    {tab}
                    {tab === "Services" &&
                      ` (${providerData?.services?.length || 0})`}
                    {tab === "Reviews" && ` (${reviews.length || 0})`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {renderContent()}
      </ScrollView>

      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
        isLoading={isCreatingReview}
      />

      <ContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        onSubmit={handleSendMessage}
        isLoading={isSending}
        businessName={providerData?.business_name}
        message={message}
        setMessage={setMessage}
      />
    </SafeAreaView>
  );
}
