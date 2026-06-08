import { appConfig } from "@/config/env";
import type { AttendanceMode, EventSession, EventTicket, EventV2 } from "@/types/events";

const to24HourTime = (time?: string) => {
  if (!time) {
    return "00:00";
  }

  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);

  if (!match) {
    return "00:00";
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3]?.toLowerCase();

  if (period === "pm" && hour < 12) {
    hour += 12;
  }

  if (period === "am" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
};

export const parseEventDateTime = (date?: string, time?: string) => {
  if (!date) {
    return null;
  }

  const datePart = String(date).split("T")[0];
  const parsed = new Date(`${datePart}T${to24HourTime(time)}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getSessionEndDateTime = (session: EventSession) =>
  parseEventDateTime(session.end_date || session.date, session.end_time || session.start_time);

export const isUpcomingSession = (session: EventSession, now = new Date()) => {
  const endDateTime = getSessionEndDateTime(session);
  return !endDateTime || endDateTime >= now;
};

export const getUpcomingSessions = (sessions: EventSession[] = [], now = new Date()) =>
  sessions.filter((session) => isUpcomingSession(session, now));

export const getTicketPrice = (ticket: EventTicket) => Number(ticket.price || 0);

export const getTicketRemainingQuantity = (ticket: EventTicket) => {
  const quantity = Number(ticket.quantity || 0);
  const sold = Number(ticket.total_sold ?? ticket.totalSold ?? ticket.sold ?? 0);
  return Math.max(quantity - sold, 0);
};

export const isFreeTicket = (ticket: EventTicket) =>
  ticket.is_free === true || getTicketPrice(ticket) <= 0;

export const buildEventShareUrl = (eventId: string | number) =>
  `${appConfig.webUrl}/tickets/${eventId}`;

export const normalizeAttendanceMode = (event?: Pick<EventV2, "attendance_mode"> | null) => {
  const mode = String(event?.attendance_mode || "VENUE").toUpperCase();
  if (mode === "ONLINE" || mode === "HYBRID" || mode === "VENUE") {
    return mode as AttendanceMode;
  }

  return "VENUE";
};

export const formatEnumLabel = (value?: string | null) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getAttendanceLabel = (event?: Pick<EventV2, "attendance_mode"> | null) => {
  const mode = normalizeAttendanceMode(event);
  if (mode === "ONLINE") return "Online event";
  if (mode === "HYBRID") return "Venue + online";
  return "In-person event";
};

export const getOnlineRevealLabel = (value?: string | null) => {
  const rule = String(value || "AFTER_BOOKING").toUpperCase();
  if (rule === "AFTER_PAYMENT") return "Join link is shared after payment.";
  if (rule === "BEFORE_EVENT") return "Join link is shared before the event starts.";
  return "Join link is shared after booking.";
};

export const eventHasOnlineAccess = (event?: Pick<EventV2, "attendance_mode"> | null) => {
  const mode = normalizeAttendanceMode(event);
  return mode === "ONLINE" || mode === "HYBRID";
};

export const eventNeedsVenue = (event?: Pick<EventV2, "attendance_mode"> | null) => {
  const mode = normalizeAttendanceMode(event);
  return mode === "VENUE" || mode === "HYBRID";
};

export const isEventEnded = (event?: Pick<EventV2, "sessions"> | null, now = new Date()) => {
  const sessions = event?.sessions || [];
  return sessions.length > 0 && getUpcomingSessions(sessions, now).length === 0;
};

export const isEventSoldOut = (event?: Pick<EventV2, "tickets"> | null) => {
  const tickets = event?.tickets || [];
  return tickets.length > 0 && tickets.every((ticket) => getTicketRemainingQuantity(ticket) <= 0);
};

export const currencySymbol = (currency?: string | null) =>
  String(currency || "").split(" - ")[0] || "";

export const calculateBookingFees = (
  subtotal: number,
  platformFeeRate = 0,
  fixedFeeAmount = 0,
  absorbFee = false
) => {
  if (subtotal <= 0 || absorbFee) {
    return {
      fixedFee: 0,
      platformFee: 0,
      total: subtotal,
    };
  }

  const platformFee = Number(((Number(platformFeeRate || 0) / 100) * subtotal).toFixed(2));
  const fixedFee = Number(fixedFeeAmount || 0);

  return {
    fixedFee,
    platformFee,
    total: subtotal + platformFee + fixedFee,
  };
};

export const canShowProtectedOnlineAccess = (booking?: any) =>
  Boolean(
    eventHasOnlineAccess(booking?.event) &&
      booking?.event?.online_access_available &&
      booking?.event?.online_url
  );
