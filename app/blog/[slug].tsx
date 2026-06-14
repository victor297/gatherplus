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
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react-native";

import {
  type BlogPost,
  useGetPublicBlogBySlugQuery,
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
      post?.hero_image_url ||
        post?.cover_image_url ||
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
  const { data: relatedData, isFetching: isRelatedFetching } =
    useGetPublicBlogsQuery(
      {
        category: post?.category || undefined,
        page: 1,
        size: 8,
      },
      { skip: !post }
    );
  const { data: latestData, isFetching: isLatestFetching } =
    useGetPublicBlogsQuery(
      {
        page: 1,
        size: 8,
      },
      { skip: !post }
    );
  const image =
    resolveImageUri(
      post?.hero_image_url ||
        post?.cover_image_url ||
        (post as any)?.image_url ||
        (post as any)?.cover_image
    ) || DEFAULT_IMAGE;
  const content = post?.content || post?.excerpt || "";
  const relatedCandidates = [
    ...(Array.isArray(relatedData?.body?.result)
      ? relatedData.body.result
      : []),
    ...(Array.isArray(latestData?.body?.result) ? latestData.body.result : []),
  ];
  const relatedPosts = relatedCandidates
    .filter((item, index, list) => {
      if (!item?.slug || item.slug === post?.slug) return false;
      return list.findIndex((candidate) => candidate.slug === item.slug) === index;
    })
    .slice(0, 4);

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
              <Text className="text-gray-600 mx-2">-</Text>
              <CalendarDays color="#728097" size={14} />
              <Text className="text-gray-500 text-xs ml-1">
                {formatDate(post.published_at || post.created_at)}
              </Text>
              {post.reading_minutes ? (
                <>
                  <Text className="text-gray-600 mx-2">-</Text>
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
                  baseStyle={{
                    color: "#D1D5DB",
                    fontSize: 16,
                    lineHeight: 26,
                  }}
                  enableCSSInlineProcessing={false}
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
                    div: {
                      color: "#D1D5DB",
                      fontSize: 16,
                      lineHeight: 26,
                    },
                    em: { color: "#E5E7EB", fontStyle: "italic" },
                    li: { color: "#D1D5DB", fontSize: 16 },
                    ol: { color: "#D1D5DB" },
                    p: {
                      color: "#D1D5DB",
                      fontSize: 16,
                      lineHeight: 26,
                      marginBottom: 12,
                    },
                    span: { color: "#D1D5DB" },
                    strong: { color: "white", fontWeight: "700" },
                    ul: { color: "#D1D5DB" },
                  }}
                />
              ) : (
                <Text className="text-gray-400">No story content available.</Text>
              )}
            </View>

            <View className="mt-8">
              <View className="mb-3 flex-row items-end justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-2xl font-bold">
                    Related articles
                  </Text>
                  <Text className="mt-1 text-gray-400">
                    More stories to keep exploring GatherPlux.
                  </Text>
                </View>
                <TouchableOpacity
                  className="rounded-full border border-[#2A3546] bg-[#111823] px-4 py-2"
                  onPress={() => router.push("/blog" as any)}
                >
                  <Text className="text-primary font-bold">All</Text>
                </TouchableOpacity>
              </View>

              {isRelatedFetching || isLatestFetching ? (
                <View className="py-5">
                  <ActivityIndicator color="#9EDD45" />
                </View>
              ) : relatedPosts.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 8 }}
                >
                  {relatedPosts.map((related) => (
                    <TouchableOpacity
                      key={related.slug}
                      activeOpacity={0.9}
                      className="w-64 overflow-hidden rounded-2xl border border-[#243044] bg-[#111823]"
                      onPress={() => router.push(`/blog/${related.slug}` as any)}
                    >
                      <Image
                        source={{ uri: postImage(related) }}
                        className="h-28 w-full bg-[#1A2432]"
                        resizeMode="cover"
                      />
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <Text
                            className="text-primary text-[11px] font-bold uppercase"
                            numberOfLines={1}
                          >
                            {related.category || "Story"}
                          </Text>
                          <Text className="mx-2 text-gray-600">-</Text>
                          <Text className="text-gray-500 text-[11px]">
                            {formatDate(
                              related.published_at || related.created_at
                            )}
                          </Text>
                        </View>
                        <Text
                          className="mt-3 text-white text-lg font-bold leading-6"
                          numberOfLines={2}
                        >
                          {related.title}
                        </Text>
                        {!!related.excerpt && (
                          <Text
                            className="mt-2 text-gray-400 text-sm leading-5"
                            numberOfLines={2}
                          >
                            {related.excerpt}
                          </Text>
                        )}
                        <View className="mt-4 flex-row items-center">
                          <Text className="text-primary font-bold">
                            Read next
                          </Text>
                          <ArrowRight color="#9EDD45" size={16} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="rounded-2xl border border-[#243044] bg-[#111823] p-5">
                  <Text className="text-white text-lg font-bold">
                    More stories are coming
                  </Text>
                  <Text className="mt-2 text-gray-400 leading-5">
                    New GatherPlux articles will appear here as they are
                    published.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
