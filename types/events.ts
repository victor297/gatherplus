export type AttendanceMode = "VENUE" | "ONLINE" | "HYBRID";
export type EventLifecycleType = "SINGLE" | "RECURRING";
export type OnlineEventPlatform = "ZOOM" | "GOOGLE_MEET" | "TEAMS" | "YOUTUBE" | "CUSTOM";
export type OnlineUrlReveal = "AFTER_BOOKING" | "AFTER_PAYMENT" | "BEFORE_EVENT";
export type RecurringFrequency = "DAILY" | "WEEKLY" | "QUARTERLY" | "MONTHLY" | "YEARLY";

export interface EventParticipant {
  description?: string;
  id?: string | number;
  image?: string;
  label?: string;
  name?: string;
  title?: string;
}

export interface EventTicket {
  absorb_fee?: boolean;
  currency?: string;
  description?: string;
  id?: string | number;
  is_free?: boolean;
  name?: string;
  no_per_seat_type?: number;
  price?: number | string;
  quantity?: number;
  seat_type?: string;
  sold?: number;
  totalSold?: number;
  total_sold?: number;
}

export interface EventSession {
  date?: string;
  end_date?: string;
  end_time?: string;
  id?: string | number;
  name?: string;
  participants?: EventParticipant[];
  start_time?: string;
  tickets?: EventTicket[];
}

export interface EventFaq {
  answer: string;
  id?: string | number;
  is_active?: boolean;
  question: string;
  sort_order?: number;
}

export interface EventListParams {
  attendance_mode?: AttendanceMode;
  category_id?: string | number;
  city?: string;
  country_code?: string;
  end_date?: string;
  page?: number | string;
  price?: "free" | "paid";
  search?: string;
  size?: number | string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  start_date?: string;
  state_id?: string | number;
  type?: string;
}

export interface EventV2 {
  address?: string;
  age_restriction?: number;
  agenda_info?: string;
  attendance_mode?: AttendanceMode;
  category_id?: string | number;
  category?: {
    id?: string | number;
    name?: string;
  };
  city?: string;
  country_code?: string;
  currency?: string;
  description?: string;
  discount_info?: string;
  door_time?: string;
  event_type?: EventLifecycleType;
  each_ticket_identity?: boolean;
  faqs?: EventFaq[];
  guardian_required?: boolean;
  id?: string | number;
  images?: string[];
  is_free?: boolean;
  online_access_instructions?: string;
  online_platform?: string;
  online_timezone?: string;
  online_url?: string;
  online_url_reveal?: OnlineUrlReveal;
  parking_info?: string;
  price?: number | string;
  published?: boolean;
  recurring_frequency?: RecurringFrequency | string;
  sessions?: EventSession[];
  state_id?: string | number | null;
  summary?: string;
  absorb_fee?: boolean;
  tags?: string[];
  ticketed?: boolean;
  tickets?: EventTicket[];
  title?: string;
}

export interface CreateEventV2Payload
  extends Omit<EventV2, "id" | "sessions" | "tickets" | "faqs"> {
  sessions: EventSession[];
  tickets: EventTicket[];
  faqs?: EventFaq[];
}
