import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RenderHTML from "react-native-render-html";
import { ArrowLeft, CalendarDays } from "lucide-react-native";

import { useGetPublicBlogBySlugQuery } from "@/redux/api/blogApiSlice";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30";

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

export default function BlogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const { data, isFetching, isLoading } = useGetPublicBlogBySlugQuery(
    String(slug || ""),
    { skip: !slug }
  );

  const post = data?.body;
  const image = post?.hero_image_url || post?.cover_image_url || DEFAULT_IMAGE;
  const content = post?.content || post?.excerpt || "";

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-[#1A2432] rounded-full p-3"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#E5E7EB" size={21} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold">Story</Text>
        <View className="w-11" />
      </View>

      {isLoading || isFetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9EDD45" />
        </View>
      ) : !post ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-xl font-bold text-center">
            Story unavailable
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            This blog post could not be loaded.
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-xl px-6 py-3 mt-6"
            onPress={() => router.replace("/blog" as any)}
          >
            <Text className="text-background font-bold">Back to blog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Image
            source={{ uri: image }}
            className="w-full h-64 bg-[#1A2432]"
            resizeMode="cover"
          />
          <View className="px-5 pt-6">
            <View className="flex-row flex-wrap items-center">
              <Text className="text-primary text-xs font-bold uppercase">
                {post.category || "Story"}
              </Text>
              <Text className="text-gray-600 mx-2">•</Text>
              <CalendarDays color="#728097" size={14} />
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

            <Text className="text-white text-4xl font-bold mt-4 leading-[44px]">
              {post.title}
            </Text>

            {!!post.excerpt && (
              <Text className="text-gray-300 leading-7 text-base mt-4">
                {post.excerpt}
              </Text>
            )}

            {(post.author_name || post.author_title) && (
              <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mt-6">
                <Text className="text-white font-bold">
                  {post.author_name || "GatherPlux"}
                </Text>
                {!!post.author_title && (
                  <Text className="text-gray-400 mt-1">{post.author_title}</Text>
                )}
              </View>
            )}

            <View className="bg-[#111823] border border-[#243044] rounded-2xl p-4 mt-6">
              {content ? (
                <RenderHTML
                  contentWidth={width - 40}
                  source={{ html: content }}
                  tagsStyles={{
                    a: { color: "#9EDD45", fontWeight: "700" },
                    blockquote: {
                      borderLeftColor: "#8B6BFF",
                      borderLeftWidth: 3,
                      color: "#D1D5DB",
                      paddingLeft: 12,
                    },
                    br: { height: 10 },
                    h1: { color: "white", fontSize: 28 },
                    h2: { color: "white", fontSize: 24 },
                    h3: { color: "white", fontSize: 20 },
                    li: { color: "#D1D5DB", fontSize: 16 },
                    p: {
                      color: "#D1D5DB",
                      fontSize: 16,
                      lineHeight: 26,
                      marginBottom: 12,
                    },
                    strong: { color: "white", fontWeight: "700" },
                    ul: { color: "#D1D5DB" },
                  }}
                />
              ) : (
                <Text className="text-gray-400">No story content available.</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
