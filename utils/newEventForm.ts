import type {
  AiEventBuilderRequest,
  AiEventDraft,
} from "@/types/aiEventBuilder";
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
export const AI_EVENT_DRAFT_STORAGE_KEY = "gatherplus.aiEventDraft.v1";
export const AI_EVENT_IMPORT_STORAGE_KEY = "gatherplus.aiEventImport.v1";

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

const readPath = (source: unknown, paths: string[]) => {
  if (!source || typeof source !== "object") return "";

  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, source);

    if (Array.isArray(value)) {
      const compact = value.map((item) => trim(item)).filter(Boolean);
      if (compact.length > 0) return compact;
    }

    if (value !== undefined && value !== null && trim(value)) return value;
  }

  return "";
};

const pickText = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const compact = value.map((item) => trim(item)).filter(Boolean);
      if (compact.length > 0) return compact.join(", ");
    }

    const text = trim(value);
    if (text) return text;
  }

  return "";
};

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 0;
};

const normalizeDateOnly = (value: unknown) => {
  const text = trim(value);
  if (!text) return "";

  const direct = text.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (direct) return direct;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

const normalizeTimeText = (value: unknown, fallback = "") => {
  const text = trim(value);
  if (!text) return fallback;

  const twentyFourHour = text.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = twentyFourHour[2];
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${suffix}`;
  }

  return text;
};

const generateTags = (draft: AiEventDraft, request?: AiEventBuilderRequest) => {
  const provided = parseTags(
    pickText(
      request?.tags,
      readPath(draft, ["details.tags", "enhancements.tags", "tags"])
    )
  );

  if (provided.length > 0) return provided.slice(0, 8).join(", ");

  const source = `${pickText(
    readPath(draft, ["details.title", "title"]),
    request?.prompt,
    request?.audience
  )}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !["event", "people", "about", "with"].includes(word));

  const unique = Array.from(new Set(source));
  return unique.slice(0, 5).join(", ") || "community, gathering, experience";
};

const normalizeAiFaqs = (draft: AiEventDraft, request?: AiEventBuilderRequest) => {
  const rawFaqs = readPath(draft, ["enhancements.faqs", "details.faqs", "faqs"]);
  if (Array.isArray(rawFaqs)) {
    const faqs = rawFaqs
      .map((faq: any) => ({
        question: trim(faq?.question || faq?.title || faq?.q),
        answer: trim(faq?.answer || faq?.description || faq?.a),
      }))
      .filter((faq) => faq.question);

    if (faqs.length > 0) return faqs;
  }

  const audience = pickText(request?.audience, "attendees");
  return [
    {
      question: "Who should attend?",
      answer: `This event is designed for ${audience}.`,
    },
    {
      question: "Will I receive a ticket confirmation?",
      answer: "Yes. GatherPlus sends a confirmation with your secure ticket access after booking.",
    },
    {
      question: "Can I share my ticket?",
      answer: "Use the secure booking link or ticket code provided after checkout.",
    },
  ];
};

const normalizeAiSessions = (draft: AiEventDraft, request?: AiEventBuilderRequest) => {
  const rawSessions = readPath(draft, ["details.sessions", "sessions"]);
  const sessionList = Array.isArray(rawSessions) ? rawSessions : [];
  const date = normalizeDateOnly(
    readPath(draft, ["details.start_date", "start_date", "date"]) || request?.dateHint
  );

  if (sessionList.length > 0) {
    return sessionList.map((session: any, index) => ({
      name: pickText(session?.name, session?.title, `Session ${index + 1}`),
      startDate: normalizeDateOnly(session?.date || session?.start_date || date),
      endDate: normalizeDateOnly(session?.end_date || session?.date || session?.start_date || date),
      startTime: normalizeTimeText(session?.start_time || session?.startTime, request?.startTime || "6:00 PM"),
      endTime: normalizeTimeText(session?.end_time || session?.endTime, request?.endTime || "8:00 PM"),
      participants: Array.isArray(session?.participants) ? session.participants : [],
    }));
  }

  return [
    {
      name: "Main session",
      startDate: date,
      endDate: date,
      startTime: normalizeTimeText(request?.startTime, "6:00 PM"),
      endTime: normalizeTimeText(request?.endTime, "8:00 PM"),
      participants: [],
    },
  ];
};

const normalizeAiTickets = (draft: AiEventDraft, request?: AiEventBuilderRequest) => {
  const rawTickets = readPath(draft, ["tickets.items", "tickets.tickets", "tickets"]);
  const ticketList = Array.isArray(rawTickets) ? rawTickets : [];
  const planText = pickText(request?.ticketPlan, request?.budget).toLowerCase();
  const requestedPrice = pickNumber(request?.basePrice, readPath(draft, ["tickets.price", "tickets.basePrice"]));
  const isFree = planText.includes("free") || (!requestedPrice && !planText.includes("paid"));
  const quantity = pickNumber(request?.expectedGuests, readPath(draft, ["tickets.quantity"])) || 100;

  if (ticketList.length > 0) {
    return ticketList.map((ticket: any, index) => ({
      name: pickText(ticket?.name, ticket?.title, index === 0 ? "General admission" : `Ticket ${index + 1}`),
      price: isFree ? 0 : pickNumber(ticket?.price, ticket?.basePrice, requestedPrice),
      quantity: pickNumber(ticket?.quantity, ticket?.capacity, quantity) || quantity,
      seat_type: ticket?.seat_type || "SEAT",
      no_per_seat_type: Number(ticket?.no_per_seat_type || 1),
    }));
  }

  return [
    {
      name: pickText(request?.ticketName, "General admission"),
      price: isFree ? 0 : requestedPrice,
      quantity,
      seat_type: "SEAT",
      no_per_seat_type: 1,
    },
  ];
};

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

export const mapAiDraftToMobileForm = (
  draft: AiEventDraft,
  request?: AiEventBuilderRequest
) => {
  const details = draft.details || {};
  const enhancements = draft.enhancements || {};
  const sessions = normalizeAiSessions(draft, request);
  const tickets = normalizeAiTickets(draft, request);
  const attendanceMode = normalizeAttendanceMode(
    request?.attendanceMode || readPath(draft, ["details.attendance_mode", "details.attendanceMode"])
  );
  const isFree = tickets.every((ticket) => Number(ticket.price || 0) <= 0);
  const title = pickText(
    readPath(details, ["title", "eventTitle", "name"]),
    readPath(draft, ["title"]),
    "Untitled event"
  );
  const summary = pickText(
    readPath(details, ["summary", "short_description", "shortDescription"]),
    readPath(draft, ["summary"]),
    request?.prompt
  );
  const description = pickText(
    readPath(details, ["description", "long_description", "longDescription"]),
    readPath(enhancements, ["description", "attendee_description", "attendeeDescription"]),
    summary
  );
  const ageRule = pickText(request?.ageRule, readPath(details, ["age_rule", "ageRule"]));
  const ageMatch = ageRule.match(/\d+/);

  return {
    title,
    eventCategory: "",
    category_id: pickText(
      request?.categoryId,
      readPath(details, ["category_id", "categoryId"])
    ),
    summary,
    sessionType: sessions.length > 1 ? "multiple" : "single",
    state_id: pickNumber(request?.stateId, readPath(details, ["state_id", "stateId"])),
    city: pickText(request?.city, readPath(details, ["city"])),
    country_code: pickText(
      request?.country,
      readPath(details, ["country_code", "countryCode", "country"])
    ) || "NG",
    description,
    images: Array.isArray(draft.media?.images) ? draft.media.images : [],
    start_date: sessions[0]?.startDate || "",
    address: pickText(readPath(details, ["address", "venue", "location.address"])),
    currency: isFree
      ? ""
      : pickText(request?.currencyLabel, request?.currency, readPath(draft, ["tickets.currency"])),
    each_ticket_identity: true,
    price: Number(tickets[0]?.price || 0),
    age_restriction: ageMatch ? Number(ageMatch[0]) : 0,
    guardian_required: /guardian|parent/i.test(ageRule),
    is_free: isFree,
    event_type: normalizeEventType(readPath(details, ["event_type", "eventType"])).toLowerCase(),
    recurring_frequency: pickText(
      readPath(details, ["recurring_frequency", "recurringFrequency"]),
      "WEEKLY"
    ),
    attendance_mode: attendanceMode,
    online_platform: normalizeOnlinePlatform(
      request?.onlinePlatform || readPath(details, ["online_platform", "onlinePlatform"])
    ),
    online_url: pickText(readPath(details, ["online_url", "onlineUrl"])),
    online_access_instructions: pickText(
      request?.onlineAccessInstructions,
      readPath(details, ["online_access_instructions", "onlineAccessInstructions"]),
      needsOnline(attendanceMode) ? "Online access details will be shared after booking." : ""
    ),
    online_timezone: pickText(
      request?.onlineTimezone,
      readPath(details, ["online_timezone", "onlineTimezone"]),
      DEFAULT_TIMEZONE
    ),
    online_url_reveal: "AFTER_BOOKING",
    tags: generateTags(draft, request),
    faqs: normalizeAiFaqs(draft, request),
    door_time: pickText(readPath(enhancements, ["door_time", "doorTime"])),
    parking_info: pickText(readPath(enhancements, ["parking_info", "parkingInfo"])),
    discount_info: pickText(readPath(enhancements, ["lineup", "discount_info", "discountInfo"])),
    agenda_info: pickText(readPath(enhancements, ["agenda_info", "agendaInfo", "agenda"])),
    time: "",
    absorb_fee: true,
    ticketed: tickets.length > 0,
    tickets,
    sessions,
  };
};
