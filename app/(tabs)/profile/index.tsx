import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  ArrowLeft,
  ChevronRight,
  Ticket,
  Mail,
  Lock,
  Bookmark,
  LogOutIcon,
  Star,
  Book,
  BookDashed,
  MessageCircleIcon,
  Calendar1Icon,
  Users,
  Globe2,
  BarChart3,
  Send,
  Briefcase,
  Sparkles,
} from "lucide-react-native";
import { useGetProfileQuery } from "@/redux/api/usersApiSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  checkTokenImmediately,
  logout,
  startTokenExpirationCheck,
} from "@/redux/features/auth/authSlice";
import { useGetproviderdetailsQuery } from "@/redux/api/providersApiSlice";
import { apiSlice } from "@/redux/api/apiSlice";

export default function ProfileScreen() {
  const router: any = useRouter();
  const dispatch: any = useDispatch();
  const { userInfo } = useSelector((state: any) => state.auth); // Get auth state from Redux
  const {
    data: userProfile,
    isLoading: isFetchingProfile,
    error: profileError,
  } = useGetProfileQuery<any>(null, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const {
    data: providers,
    error: providersError,
    isLoading: isprovidersLoading,
    isFetching: isFetchingproviders,
    refetch: refetchproviders,
  } = useGetproviderdetailsQuery(userInfo?.sub); // Handle manual logout
  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    router.replace("/(auth)/login"); // Redirect to login after manual logout
  };
  const handleNavigate = async () => {
    providers?.body
      ? router.push("/(provider)/profile")
      : router.push("/(provider)/complete-profile");
  };

  // Start token expiration check
  useEffect(() => {
    if (userInfo) {
      dispatch(checkTokenImmediately());
      const cleanup = dispatch(startTokenExpirationCheck());
      return cleanup;
    }
  }, [dispatch, userInfo]);

  if (!userInfo) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <User size={80} color="#9EDD45" />
        <Text className="text-white text-2xl font-bold mt-6 text-center">
          Profile Access
        </Text>
        <Text className="text-gray-400 text-center mt-2 mb-8">
          Please log in or sign up to view and manage your profile settings, bookings, and more.
        </Text>
        <TouchableOpacity
          className="bg-primary w-full py-4 rounded-xl items-center"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-background font-bold text-lg">Login / Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-4"
          onPress={() => router.replace("/(tabs)/home/home1")}
        >
          <Text className="text-primary font-medium">Continue Browsing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const iconColor = "#A7B0C2";
  const menuSections = [
    {
      title: "General",
      items: [
        {
          icon: <Globe2 size={22} color={iconColor} />,
          title: "Find Events & Planners",
          subtitle: "Browse cities, planners, and events",
          route: "/marketplace",
        },
        {
          icon: <BookDashed size={22} color={iconColor} />,
          title: "Bookings",
          subtitle: "Ticket library and access codes",
          route: "/profile/bookings",
        },
        {
          icon: <Bookmark size={22} color={iconColor} />,
          title: "Bookmarks",
          subtitle: "Saved events and planners",
          route: "/profile/bookmarks",
        },
      ],
    },
    {
      title: "Organizer",
      items: [
        {
          icon: <Ticket size={22} color={iconColor} />,
          title: "Organizer Workspace",
          subtitle: "Manage drafts, previews, attendees",
          route: "/profile/events",
        },
        {
          icon: <Sparkles size={22} color={iconColor} />,
          title: "Create with AI",
          subtitle: "Generate an event draft",
          route: "/create/ai",
        },
        {
          icon: <BarChart3 size={22} color={iconColor} />,
          title: "Insights",
          subtitle: "ROI, conversion, check-in readiness",
          route: "/profile/insights",
        },
        {
          icon: <Send size={22} color={iconColor} />,
          title: "Delivery Log",
          subtitle: "Email/SMS updates and retry status",
          route: "/profile/delivery-log",
        },
        {
          icon: <Star size={22} color={iconColor} />,
          title: "Revenue",
          subtitle: "Wallet and payout requests",
          route: "/profile/revenue",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          icon: <Ticket size={22} color={iconColor} />,
          title: "Promo Codes",
          subtitle: "Discounts, limits, analytics",
          route: "/profile/promo-codes",
        },
        {
          icon: <Book size={22} color={iconColor} />,
          title: "GatherPlux Blog",
          subtitle: "Organizer tips and product updates",
          route: "/blog",
        },
      ],
    },
    {
      title: "Team",
      items: [
        {
          icon: <Users size={22} color={iconColor} />,
          title: "Agent Workspace",
          subtitle: "Codes, commissions, payouts",
          route: "/profile/agent",
        },
        {
          icon: <Users size={22} color={iconColor} />,
          title: "Attendee CRM",
          subtitle: "Segments, notes, and safe follow-ups",
          route: "/profile/attendees",
        },
        {
          icon: <MessageCircleIcon size={22} color={iconColor} />,
          title: "Messages",
          subtitle: "Provider and booking conversations",
          route: "/(provider)/(chats)/chats",
        },
        {
          icon: <Calendar1Icon size={22} color={iconColor} />,
          title: "Appointments",
          subtitle: "Planner service bookings",
          route: "/(provider)/appointments",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: <Mail size={22} color={iconColor} />,
          title: "Change Email",
          subtitle: "Update your email",
          route: "/profile/change-email",
        },
        {
          icon: <Lock size={22} color={iconColor} />,
          title: "Password",
          subtitle: "Update your password",
          route: "/profile/change-password",
        },
      ],
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      <View className="px-4 pt-12 pb-4">
        <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => router.replace("/home/home1")}
            className="mr-4 bg-[#162033] p-2 rounded-xl border border-white/5"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
          <Text className="text-white text-2xl font-black">Settings</Text>
        </View>
      </View>

      {profileError && (
        <View className="px-4 py-4 bg-red-500/20 border border-red-500/30 rounded-xl mx-4 mb-4">
          <Text className="text-white text-center">
            {profileError?.data?.body && typeof profileError.data.body === "string"
              ? profileError.data.body
              : "Error fetching profile data. Please try again."}
          </Text>
        </View>
      )}

      {isFetchingProfile ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : (
        <View className="px-4">
          <View className="rounded-2xl border border-[#27364C] bg-[#111823] p-3">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri:
                    userProfile?.body?.image_url ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
                }}
                className="w-16 h-16 rounded-full border-2 border-[#48A7FF]"
              />
              <TouchableOpacity
                className="ml-3 flex-1"
                onPress={() => router.push("/profile/account-info")}
              >
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  {userProfile?.body
                    ? `${userProfile.body.firstname || ""} ${userProfile.body.lastname || ""}`.trim() ||
                      "User Name"
                    : "User Name"}
                </Text>
                <Text className="text-gray-300 mt-1" numberOfLines={1}>
                  {userProfile?.body?.email || "user@example.com"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full bg-[#2F86D8] px-4 py-3"
                onPress={() => router.push("/profile/edit-profile")}
              >
                <Text className="text-white font-bold">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View className="mt-5 px-4">
        {menuSections.map((section) => (
          <View key={section.title} className="mb-5">
            <Text className="text-[#8B95A7] text-base font-semibold mb-2 ml-3">
              {section.title}
            </Text>
            <View className="gap-2">
              {section.items.map((item) => (
          <TouchableOpacity
                  key={item.title}
                  className="flex-row items-center rounded-xl border border-[#27364C] bg-[#111823] px-4 py-4"
            onPress={() => router.push(item.route)}
          >
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#0C1422] border border-white/5">
                    {item.icon}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white text-base font-black">
                      {item.title}
                    </Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                      {item.subtitle}
                    </Text>
            </View>
                  <ChevronRight color="#8B95A7" size={22} />
          </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className="px-4 mt-1 gap-3">
        <TouchableOpacity
          className="rounded-xl border border-[#9EDD45]/30 bg-[#9EDD45]/10 py-4"
          onPress={handleNavigate}
        >
          <View className="flex-row items-center gap-2 justify-center">
            <Briefcase color="#9EDD45" size={20} />
            <Text className="text-primary text-center text-base font-black">
              Planner Workspace
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-xl border border-[#27364C] bg-[#111823] py-4"
          onPress={handleLogout}
        >
          <View className="flex-row items-center gap-2 justify-center">
            <LogOutIcon color="#E5E7EB" size={19} />
            <Text className="text-white text-center text-base font-black">
              Logout
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
