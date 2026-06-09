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
