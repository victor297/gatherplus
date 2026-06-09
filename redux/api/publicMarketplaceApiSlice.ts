import { compactParams } from "@/utils/api";
import { apiSlice } from "./apiSlice";

export type ApiSuccessResponse<T> = {
  code: number;
  message: string;
  body: T;
};

export type PaginatedBody<T> = {
  result: T[];
  totalItems: number;
  totalPages?: number;
  currentPage?: number;
  page?: number;
  size?: number;
};

export type MarketplaceProfileLite = {
  user_id?: number | null;
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  image_url?: string | null;
  email?: string | null;
  company?: string | null;
  website?: string | null;
};

export type MarketplaceUserLite = {
  id: number;
  username?: string | null;
  profile?: MarketplaceProfileLite | null;
};

export type MarketplaceCountryLite = {
  code2: string;
  name: string;
  currency?: string | null;
  currency_symbol?: string | null;
};

export type MarketplaceStateLite = {
  id: number;
  code?: string | null;
  name: string;
};

export type MarketplaceCategoryLite = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
};

export type MarketplaceCitySummary = {
  countryCode: string;
  country: string;
  city: string;
  plannersCount: number;
  eventsCount: number;
  activityScore: number;
  href?: string;
  filters?: {
    country_code: string;
    city: string;
  };
};

export type MarketplaceCountrySummary = {
  countryCode: string;
  country: string;
  plannersCount: number;
  eventsCount: number;
  totalCities: number;
  activityScore: number;
  topCities: MarketplaceCitySummary[];
  href?: string;
};

export type MarketplaceOverviewBody = {
  countries: MarketplaceCountrySummary[];
  meta: {
    totalCountries: number;
    totalCities: number;
    totalPlanners: number;
    totalEvents: number;
    limitCountries: number;
    limitCities: number;
  };
};

export type MarketplaceCountryDetailBody = {
  summary: MarketplaceCountrySummary & {
    currency?: string | null;
    currency_symbol?: string | null;
  };
  cities: PaginatedBody<MarketplaceCitySummary>;
};

export type MarketplacePlanner = {
  id: number;
  user_id?: number | null;
  business_name?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  country_code?: string | null;
  verified?: boolean;
  rating?: number | null;
  total_reviews?: number | null;
  profile_image?: string | null;
  cover_image?: string | null;
  website?: string | null;
  specialties?: string[];
  languages_spoken?: string[];
  category?: MarketplaceCategoryLite | null;
  subcategory?: MarketplaceCategoryLite | null;
  state?: MarketplaceStateLite | null;
  country?: MarketplaceCountryLite | null;
  user?: MarketplaceUserLite | null;
  servicesCount?: number;
  galleriesCount?: number;
  reviewsCount?: number;
  marketplaceFilters?: {
    country_code?: string | null;
    city?: string | null;
  };
};

export type MarketplaceEventPrimarySession = {
  id: number;
  name?: string | null;
  date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export type MarketplaceEvent = {
  id: number;
  title: string;
  description?: string | null;
  images?: string[];
  city?: string | null;
  address?: string | null;
  country_code?: string | null;
  currency?: string | null;
  event_type?: "SINGLE" | "RECURRING";
  is_free?: boolean;
  ticketed?: boolean;
  published?: boolean;
  start_date?: string | null;
  time?: string | null;
  startingPrice?: number | null;
  price?: number | string | null;
  primarySession?: MarketplaceEventPrimarySession | null;
  interestedCount?: number;
  commentCount?: number;
  bookingCount?: number;
  category?: MarketplaceCategoryLite | null;
  state?: MarketplaceStateLite | null;
  country?: MarketplaceCountryLite | null;
  host?: MarketplaceUserLite | null;
  marketplaceFilters?: {
    country_code?: string | null;
    city?: string | null;
    category_id?: number | null;
  };
};

export type MarketplaceCityDetailBody = {
  summary: MarketplaceCitySummary & {
    currency?: string | null;
    currency_symbol?: string | null;
  };
  featuredPlanners: MarketplacePlanner[];
  featuredEvents: MarketplaceEvent[];
};

export type MarketplaceOverviewQuery = {
  limitCountries?: number;
  limitCities?: number;
  countryCodes?: string;
  country_codes?: string;
  search?: string;
  country_code?: string;
  city?: string;
  verifiedOnly?: boolean;
  provider_category_id?: number;
  event_category_id?: number;
  category_id?: number;
};

export type MarketplaceCountriesQuery = MarketplaceOverviewQuery & {
  page?: number;
  size?: number;
  countrySearch?: string;
  searchCountry?: string;
};

export type MarketplaceCitiesQuery = MarketplaceOverviewQuery & {
  page?: number;
  size?: number;
};

export type MarketplaceCountryDetailQuery = {
  page?: number;
  size?: number;
  citySearch?: string;
  search?: string;
};

export type MarketplaceCityPlannersQuery = {
  page?: number;
  size?: number;
  search?: string;
  verifiedOnly?: boolean;
  category_id?: number;
  sortBy?:
    | "business_name"
    | "name"
    | "rating"
    | "reviews"
    | "total_reviews"
    | "created_at"
    | "newest";
  sortDirection?: "asc" | "desc";
};

export type MarketplaceCityEventsQuery = {
  page?: number;
  size?: number;
  search?: string;
  category_id?: number;
  event_type?: "SINGLE" | "RECURRING";
  type?: "UPCOMING" | "PAST" | "LIVE";
  price?: "free" | "paid";
  sortBy?:
    | "title"
    | "price"
    | "price_desc"
    | "price_asc"
    | "start_date"
    | "soonest"
    | "popular"
    | "updated_at"
    | "created_at"
    | "newest";
  sortDirection?: "asc" | "desc";
};

const MARKETPLACE_URL = "/marketplace";

export const publicMarketplaceApiSlice = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMarketplaceOverview: builder.query<
      ApiSuccessResponse<MarketplaceOverviewBody>,
      MarketplaceOverviewQuery | void
    >({
      query: (params = {}) => ({
        url: `${MARKETPLACE_URL}/overview`,
        params: compactParams(params),
      }),
      providesTags: ["Marketplace"],
    }),
    getMarketplaceCountries: builder.query<
      ApiSuccessResponse<PaginatedBody<MarketplaceCountrySummary>>,
      MarketplaceCountriesQuery | void
    >({
      query: (params = {}) => ({
        url: `${MARKETPLACE_URL}/countries`,
        params: compactParams(params),
      }),
      providesTags: ["Marketplace"],
    }),
    getMarketplaceCountryDetail: builder.query<
      ApiSuccessResponse<MarketplaceCountryDetailBody>,
      { countryCode: string; params?: MarketplaceCountryDetailQuery }
    >({
      query: ({ countryCode, params = {} }) => ({
        url: `${MARKETPLACE_URL}/countries/${encodeURIComponent(countryCode)}`,
        params: compactParams(params),
      }),
      providesTags: (_result, _error, { countryCode }) => [
        { type: "Marketplace", id: `country-${countryCode}` },
      ],
    }),
    getMarketplaceCities: builder.query<
      ApiSuccessResponse<PaginatedBody<MarketplaceCitySummary>>,
      MarketplaceCitiesQuery | void
    >({
      query: (params = {}) => ({
        url: `${MARKETPLACE_URL}/cities`,
        params: compactParams(params),
      }),
      providesTags: ["Marketplace"],
    }),
    getMarketplaceCityDetail: builder.query<
      ApiSuccessResponse<MarketplaceCityDetailBody>,
      { countryCode: string; city: string }
    >({
      query: ({ countryCode, city }) => ({
        url: `${MARKETPLACE_URL}/cities/${encodeURIComponent(
          countryCode
        )}/${encodeURIComponent(city)}`,
      }),
      providesTags: (_result, _error, { countryCode, city }) => [
        { type: "Marketplace", id: `city-${countryCode}-${city}` },
      ],
    }),
    getMarketplaceCityPlanners: builder.query<
      ApiSuccessResponse<PaginatedBody<MarketplacePlanner>>,
      {
        countryCode: string;
        city: string;
        params?: MarketplaceCityPlannersQuery;
      }
    >({
      query: ({ countryCode, city, params = {} }) => ({
        url: `${MARKETPLACE_URL}/cities/${encodeURIComponent(
          countryCode
        )}/${encodeURIComponent(city)}/planners`,
        params: compactParams(params),
      }),
      providesTags: (_result, _error, { countryCode, city }) => [
        { type: "Marketplace", id: `planners-${countryCode}-${city}` },
      ],
    }),
    getMarketplaceCityEvents: builder.query<
      ApiSuccessResponse<PaginatedBody<MarketplaceEvent>>,
      { countryCode: string; city: string; params?: MarketplaceCityEventsQuery }
    >({
      query: ({ countryCode, city, params = {} }) => ({
        url: `${MARKETPLACE_URL}/cities/${encodeURIComponent(
          countryCode
        )}/${encodeURIComponent(city)}/events`,
        params: compactParams(params),
      }),
      providesTags: (_result, _error, { countryCode, city }) => [
        { type: "Marketplace", id: `events-${countryCode}-${city}` },
      ],
    }),
  }),
});

export const {
  useGetMarketplaceOverviewQuery,
  useGetMarketplaceCountriesQuery,
  useGetMarketplaceCountryDetailQuery,
  useGetMarketplaceCitiesQuery,
  useGetMarketplaceCityDetailQuery,
  useGetMarketplaceCityPlannersQuery,
  useGetMarketplaceCityEventsQuery,
} = publicMarketplaceApiSlice;
