import type {
  AttendanceMode,
  CreateEventV2Payload,
  EventFaq,
  EventLifecycleType,
  EventParticipant,
  EventSession,
  EventTicket,
  EventV2,
  OnlineEventPlatform,
  OnlineUrlReveal,
  RecurringFrequency,
} from "@/types/events";

export const ATTENDANCE_MODES: AttendanceMode[] = ["VENUE", "ONLINE", "HYBRID"];
export const ONLINE_PLATFORMS: OnlineEventPlatform[] = [
  "ZOOM",
  "GOOGLE_MEET",
  "TEAMS",
  "YOUTUBE",
  "CUSTOM",
];
export const ONLINE_REVEAL_OPTIONS: OnlineUrlReveal[] = [
  "AFTER_BOOKING",
  "AFTER_PAYMENT",
  "BEFORE_EVENT",
];
export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  "DAILY",
  "WEEKLY",
  "QUARTERLY",
  "MONTHLY",
  "YEARLY",
];

export const DEFAULT_TIMEZONE = "Africa/Lagos";

const trim = (value: unknown) => String(value || "").trim();

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeAttendanceMode = (value: unknown): AttendanceMode => {
  const normalized = trim(value).toUpperCase().replace(/[\s-]+/g, "_");
  return normalized === "ONLINE" || normalized === "HYBRID" ? normalized : "VENUE";
};

const normalizeEventType = (value: unknown): EventLifecycleType => {
  const normalized = trim(value).toUpperCase();
  return normalized === "RECURRING" || normalized === "RECURRING_EVENT" || normalized === "RECURRING"
    ? "RECURRING"
    : "SINGLE";
};

const normalizeOnlinePlatform = (value: unknown): OnlineEventPlatform => {
  const normalized = trim(value).toUpperCase().replace(/[\s-]+/g, "_");
  return ONLINE_PLATFORMS.includes(normalized as OnlineEventPlatform)
    ? (normalized as OnlineEventPlatform)
    : "ZOOM";
};

const normalizeReveal = (value: unknown): OnlineUrlReveal => {
  const normalized = trim(value).toUpperCase().replace(/[\s-]+/g, "_");
  return ONLINE_REVEAL_OPTIONS.includes(normalized as OnlineUrlReveal)
    ? (normalized as OnlineUrlReveal)
    : "AFTER_BOOKING";
};

const normalizeRecurringFrequency = (value: unknown): RecurringFrequency | undefined => {
  const normalized = trim(value).toUpperCase();
  return RECURRING_FREQUENCIES.includes(normalized as RecurringFrequency)
    ? (normalized as RecurringFrequency)
    : undefined;
};

export const parseTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((tag) => trim(tag).replace(/^#/, "").toLowerCase()).filter(Boolean);
  }

  return trim(value)
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean);
};

export const stringifyTags = (tags: unknown) => parseTags(tags).join(", ");

export const needsVenue = (attendanceMode: AttendanceMode) =>
  attendanceMode === "VENUE" || attendanceMode === "HYBRID";

export const needsOnline = (attendanceMode: AttendanceMode) =>
  attendanceMode === "ONLINE" || attendanceMode === "HYBRID";

const normalizeParticipants = (participants: EventParticipant[] = []) =>
  participants
    .filter((participant) => trim(participant.label) || trim(participant.title) || trim(participant.name))
    .map((participant) => ({
      id: participant.id,
      label: trim(participant.label),
      title: trim(participant.title),
      name: trim(participant.name),
      description: trim(participant.description),
      image: trim(participant.image),
    }));

export const normalizeSessionsForPayload = (sessions: any[] = []): EventSession[] =>
  sessions
    .filter((session) => session && (session.date || session.startDate) && (session.start_time || session.startTime))
    .map((session, index) => ({
      id: session.id,
      name: trim(session.name) || `Session ${index + 1}`,
      date: trim(session.date || session.startDate),
      end_date: trim(session.end_date || session.endDate || session.date || session.startDate),
      start_time: trim(session.start_time || session.startTime),
      end_time: trim(session.end_time || session.endTime),
      participants: normalizeParticipants(session.participants || []),
    }));

export const normalizeTicketsForPayload = (tickets: any[] = [], isFree = false): EventTicket[] =>
  tickets
    .filter((ticket) => trim(ticket.name))
    .map((ticket) => ({
      id: ticket.id,
      name: trim(ticket.name),
      price: isFree ? 0 : Number(ticket.price || 0),
      quantity: Number(ticket.quantity || 0),
      seat_type: ticket.seat_type === "TABLE" ? "TABLE" : "SEAT",
      no_per_seat_type: Number(ticket.no_per_seat_type || 1),
    }));

export const normalizeFaqsForPayload = (faqs: EventFaq[] = []) =>
  faqs
    .filter((faq) => trim(faq.question))
    .map((faq, index) => ({
      id: faq.id,
      question: trim(faq.question),
      answer: trim(faq.answer),
      sort_order: index,
      is_active: faq.is_active ?? true,
    }));

export const buildNewEventPayload = (
  formData: Record<string, any>,
  published: boolean
): CreateEventV2Payload => {
  const attendance_mode = normalizeAttendanceMode(formData.attendance_mode);
  const requiresVenue = needsVenue(attendance_mode);
  const requiresOnline = needsOnline(attendance_mode);
  const isFree = Boolean(formData.is_free);
  const eventType = normalizeEventType(formData.event_type);
  const tickets = normalizeTicketsForPayload(formData.tickets || [], isFree);
  const sessions = normalizeSessionsForPayload(formData.sessions || []);

  return {
    title: trim(formData.title),
    category_id: Number(formData.category_id || 0),
    state_id: requiresVenue ? toNumberOrNull(formData.state_id) : null,
    city: requiresVenue ? trim(formData.city) : "",
    country_code: requiresVenue ? trim(formData.country_code) : "",
    address: requiresVenue ? trim(formData.address) : "",
    summary: trim(formData.summary),
    description: trim(formData.description),
    images: Array.isArray(formData.images) ? formData.images : [],
    attendance_mode,
    online_platform: requiresOnline
      ? normalizeOnlinePlatform(formData.online_platform)
      : undefined,
    online_url: requiresOnline ? trim(formData.online_url) : undefined,
    online_access_instructions: requiresOnline
      ? trim(formData.online_access_instructions)
      : undefined,
    online_timezone: requiresOnline
      ? trim(formData.online_timezone || DEFAULT_TIMEZONE)
      : undefined,
    online_url_reveal: requiresOnline
      ? normalizeReveal(formData.online_url_reveal)
      : undefined,
    event_type: eventType,
    recurring_frequency:
      eventType === "RECURRING"
        ? normalizeRecurringFrequency(formData.recurring_frequency)
        : undefined,
    tags: parseTags(formData.tags),
    faqs: normalizeFaqsForPayload(formData.faqs || []),
    door_time: trim(formData.door_time),
    parking_info: trim(formData.parking_info),
    discount_info: trim(formData.discount_info),
    agenda_info: trim(formData.agenda_info),
    currency: isFree ? "" : trim(formData.currency),
    each_ticket_identity: Boolean(formData.each_ticket_identity),
    is_free: isFree,
    absorb_fee: formData.absorb_fee ?? true,
    ticketed: tickets.length > 0,
    price: isFree ? 0 : Number(tickets[0]?.price || formData.price || 0),
    age_restriction:
      formData.age_restriction === undefined ? null : Number(formData.age_restriction || 0),
    guardian_required: Boolean(formData.guardian_required),
    published,
    sessions,
    tickets,
  } as CreateEventV2Payload;
};

export const mapNewEventToMobileForm = (event: EventV2 | Record<string, any>) => {
  const sessions = Array.isArray(event.sessions)
    ? event.sessions.map((session: any) => ({
        id: session.id,
        name: session.name || "",
        startDate: String(session.date || "").split("T")[0],
        endDate: String(session.end_date || session.date || "").split("T")[0],
        startTime: session.start_time || "",
        endTime: session.end_time || "",
        participants: Array.isArray(session.participants)
          ? session.participants.map((participant: any) => ({
              id: participant.id,
              label: participant.label || "",
              title: participant.title || "",
              name: participant.name || "",
              description: participant.description || "",
              image: participant.image || "",
            }))
          : [],
      }))
    : [];

  return {
    id: event.id,
    title: event.title || "",
    eventCategory: event.category?.name || "",
    category_id: event.category_id ? String(event.category_id) : "",
    sessionType: sessions.length > 1 ? "multiple" : "single",
    state_id: event.state_id || 0,
    city: event.city || "",
    country_code: event.country_code || "NG",
    description: event.description || "",
    summary: event.summary || "",
    images: Array.isArray(event.images) ? event.images : [],
    address: event.address || "",
    currency: event.currency || "",
    each_ticket_identity: Boolean(event.each_ticket_identity),
    price: Number(event.price || 0),
    age_restriction: Number(event.age_restriction || 0),
    guardian_required: Boolean(event.guardian_required),
    is_free: Boolean(event.is_free),
    event_type: event.event_type === "RECURRING" ? "recurring" : "single",
    recurring_frequency: event.recurring_frequency || "WEEKLY",
    absorb_fee: event.absorb_fee ?? true,
    ticketed: event.ticketed ?? true,
    attendance_mode: normalizeAttendanceMode(event.attendance_mode),
    online_platform: event.online_platform || "ZOOM",
    online_url: event.online_url || "",
    online_access_instructions: event.online_access_instructions || "",
    online_timezone: event.online_timezone || DEFAULT_TIMEZONE,
    online_url_reveal: event.online_url_reveal || "AFTER_BOOKING",
    tags: stringifyTags(event.tags),
    faqs: Array.isArray(event.faqs)
      ? event.faqs.map((faq: any) => ({
          id: faq.id,
          question: faq.question || "",
          answer: faq.answer || "",
        }))
      : [],
    door_time: event.door_time || "",
    parking_info: event.parking_info || "",
    discount_info: event.discount_info || "",
    agenda_info: event.agenda_info || "",
    published: Boolean(event.published),
    tickets: Array.isArray(event.tickets)
      ? event.tickets.map((ticket: any) => ({
          id: ticket.id,
          name: ticket.name || "",
          price: Number(ticket.price || 0),
          quantity: Number(ticket.quantity || 0),
          seat_type: ticket.seat_type || "SEAT",
          no_per_seat_type: Number(ticket.no_per_seat_type || 1),
        }))
      : [],
    sessions,
  };
};
