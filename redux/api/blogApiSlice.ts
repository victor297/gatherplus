import { compactParams } from "@/utils/api";
import type { ApiSuccessResponse, PaginatedBody } from "@/types/api";
import { apiSlice } from "./apiSlice";

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  author_name?: string | null;
  author_title?: string | null;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  reading_minutes?: number | null;
  featured?: boolean;
  published_at?: string | null;
  created_at?: string | null;
  tags?: string[] | string | null;
};

export type BlogListParams = {
  category?: string;
  featured?: boolean;
  page?: number;
  search?: string;
  size?: number;
};

export const blogApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getPublicBlogs: builder.query<
      ApiSuccessResponse<PaginatedBody<BlogPost>>,
      BlogListParams | void
    >({
      query: (params) => {
        const safeParams = params || {};

        return {
          url: "/blog",
          params: compactParams({
            page: safeParams.page ?? 1,
            size: safeParams.size ?? 12,
            search: safeParams.search,
            category: safeParams.category,
            featured:
              safeParams.featured === undefined
                ? undefined
                : String(safeParams.featured),
          }),
        };
      },
      providesTags: ["Blog"],
    }),
    getPublicBlogBySlug: builder.query<ApiSuccessResponse<BlogPost>, string>({
      query: (slug) => ({
        url: `/blog/${slug}`,
      }),
      providesTags: (_result, _error, slug) => [{ type: "Blog", id: slug }],
    }),
  }),
});

export const {
  useGetPublicBlogBySlugQuery,
  useGetPublicBlogsQuery,
  useLazyGetPublicBlogsQuery,
} = blogApiSlice;
