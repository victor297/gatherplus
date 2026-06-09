export interface ParticipantBookingQuery {
  id: string | number;
  page?: number | string;
  search?: string;
  size?: number | string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface UserTicketBooking {
  code?: string;
  created_at?: string;
  email?: string;
  event?: Record<string, unknown>;
  event_id: number;
  fullname?: string;
  id: number;
  status?: string;
  ticket?: Record<string, unknown>;
}

export interface UserBookingGroup {
  event: Record<string, any>;
  invoiceTotal: number;
  latestBookingAt?: string;
  ticketCount: number;
  tickets: UserTicketBooking[];
}

export interface OrganizerAttendeeNote {
  created_at?: string;
  event?: { id?: number; title?: string | null } | null;
  event_id?: number | null;
  id: number;
  note: string;
  pinned?: boolean;
}

export interface OrganizerAttendee {
  bookingCount: number;
  bookings?: Array<Record<string, any>>;
  email?: string | null;
  eventCount: number;
  events?: Array<{ id?: number; start_date?: string | null; title?: string | null }>;
  firstBookingAt?: string;
  key: string;
  lastBookingAt?: string;
  lastEvent?: { id?: number; start_date?: string | null; title?: string | null } | null;
  latestNote?: OrganizerAttendeeNote | null;
  name?: string | null;
  notes?: OrganizerAttendeeNote[];
  phone?: string | null;
  segment?: "UPCOMING" | "REPEAT" | "PAST" | "PENDING" | string;
  totalSpend: number;
}

export interface OrganizerAttendeesQuery {
  event_id?: string | number;
  page?: number | string;
  search?: string;
  segment?: string;
  size?: number | string;
  sortBy?: "lastBookingAt" | "bookingCount" | "totalSpend" | string;
  sortDirection?: "asc" | "desc";
}
