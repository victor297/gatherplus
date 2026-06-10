import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react-native";

import {
  BlogPost,
  useGetPublicBlogsQuery,
} from "@/redux/api/blogApiSlice";

const DEFAULT_IMAGE =
  `${String(
    process.env.EXPO_PUBLIC_WEB_URL || "https://www.gatherplux.com"
  ).replace(/\/$/, "")}/gatherplux-default.jpg`;

function resolveImageUri(value?: unknown) {
  const uri = String(value || "").trim();
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("//")) return `https:${uri}`;
  if (uri.startsWith("/")) {
    return `${String(
      process.env.EXPO_PUBLIC_WEB_URL || "https://www.gatherplux.com"
    ).replace(/\/$/, "")}${uri}`;
  }
  return uri;
}

function postImage(post?: BlogPost) {
  return (
    resolveImageUri(
      post?.cover_image_url ||
        post?.hero_image_url ||
        (post as any)?.image_url ||
        (post as any)?.cover_image
    ) || DEFAULT_IMAGE
  );
}

function formatDate(value?: string | null) {
  if (!value) return "GatherPlux";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "GatherPlux";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogIndexScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const { data, isFetching, isLoading } = useGetPublicBlogsQuery({
    category: activeCategory || undefined,
    page,
    search: submittedSearch,
    size: 10,
  });

  const posts = Array.isArray(data?.body?.result) ? data.body.result : [];
  const totalPages = Math.max(1, Number(data?.body?.totalPages || 1));
  const totalItems = Number(data?.body?.totalItems || posts.length || 0);

  const categories = useMemo(() => {
    const names = posts
      .map((post) => post.category)
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(names)).slice(0, 8);
  }, [posts]);

  const submitSearch = () => {
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-[#1A2432] rounded-full p-3"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Blog</Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-[#8B6BFF] text-xs font-bold tracking-[4px] uppercase">
          GatherPlux Blog
        </Text>
        <Text className="text-white text-4xl font-bold mt-2">
          Stories for hosts and people who love great rooms
        </Text>
        <Text className="text-gray-400 leading-6 mt-3">
          Ideas on discovery, ticketing, community, analytics, and the details
          that turn interest into attendance.
        </Text>

        <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mt-6">
          <View className="bg-[#1A2432] border border-[#2E3A4D] rounded-xl px-3 flex-row items-center">
            <Search color="#8B6BFF" size={18} />
            <TextInput
              className="flex-1 text-white py-3 ml-2"
              placeholder="Search stories, topics, strategy"
              placeholderTextColor="#728097"
              returnKeyType="search"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={submitSearch}
            />
            <TouchableOpacity
              className="bg-primary rounded-lg px-3 py-2"
              onPress={submitSearch}
            >
              <Text className="text-background font-bold">Search</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
          >
            {[{ label: "All stories", value: "" }, ...categories.map((category) => ({
              label: category,
              value: category,
            }))].map((category) => (
              <TouchableOpacity
                key={category.label}
                className={`rounded-full px-4 py-2 mr-2 border ${
                  activeCategory === category.value
                    ? "bg-primary border-primary"
                    : "bg-[#1A2432] border-[#2E3A4D]"
                }`}
                onPress={() => {
                  setActiveCategory(category.value);
                  setPage(1);
                }}
              >
                <Text
                  className={
                    activeCategory === category.value
                      ? "text-background font-bold"
                      : "text-white font-semibold"
                  }
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mt-6 flex-row justify-between items-end">
          <View>
            <Text className="text-white text-2xl font-bold">Latest stories</Text>
            <Text className="text-gray-400 mt-1">Fresh field notes from GatherPlux.</Text>
          </View>
          <Text className="text-gray-500">{totalItems} total</Text>
        </View>

        {isLoading || isFetching ? (
          <View className="py-6">
            <ActivityIndicator color="#9EDD45" />
          </View>
        ) : null}

        <View className="mt-4 gap-4">
          {posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              className="bg-[#111823] border border-[#243044] rounded-2xl overflow-hidden"
              onPress={() => router.push(`/blog/${post.slug}` as any)}
            >
              <Image
                source={{ uri: postImage(post) }}
                className="w-full h-44 bg-[#1A2432]"
                resizeMode="cover"
              />
              <View className="p-4">
                <View className="flex-row items-center flex-wrap">
                  <Text className="text-primary text-xs font-bold">
                    {post.category || "Story"}
                  </Text>
                  <Text className="text-gray-600 mx-2">•</Text>
                  <CalendarDays color="#728097" size={13} />
                  <Text className="text-gray-500 text-xs ml-1">
                    {formatDate(post.published_at || post.created_at)}
                  </Text>
                  {post.reading_minutes ? (
                    <>
                      <Text className="text-gray-600 mx-2">•</Text>
                      <Text className="text-gray-500 text-xs">
                        {post.reading_minutes} min read
                      </Text>
                    </>
                  ) : null}
                </View>
                <Text className="text-white text-xl font-bold mt-3">
                  {post.title}
                </Text>
                {!!post.excerpt && (
                  <Text className="text-gray-400 leading-6 mt-2" numberOfLines={3}>
                    {post.excerpt}
                  </Text>
                )}
                <Text className="text-primary font-bold mt-4">Read story</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!posts.length && !isLoading && !isFetching ? (
          <View className="bg-[#111823] border border-[#243044] rounded-2xl p-8 items-center mt-6">
            <Search color="#8B6BFF" size={34} />
            <Text className="text-white text-lg font-semibold mt-4">
              No stories found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Try another search or clear the category filter.
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between mt-6">
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft color="#E5E7EB" size={17} />
            <Text className="text-white ml-1">Previous</Text>
          </TouchableOpacity>
          <Text className="text-gray-300">Page {page} of {totalPages}</Text>
          <TouchableOpacity
            className="bg-[#1A2432] rounded-xl px-4 py-3 flex-row items-center disabled:opacity-40"
            disabled={page >= totalPages}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <Text className="text-white mr-1">Next</Text>
            <ChevronRight color="#E5E7EB" size={17} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
