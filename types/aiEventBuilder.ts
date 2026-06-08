export type AiAttendanceMode = "VENUE" | "ONLINE" | "HYBRID";
export type AiAutomationChannel = "EMAIL" | "NOTIFICATION" | "CHECKLIST" | "PROMO";
export type AiSuggestionPriority = "high" | "medium" | "low";

export interface AiEventBuilderStatus {
  comingSoonMessage?: string;
  hasApiKey?: boolean;
  model?: string;
  ready: boolean;
}

export interface AiEventBuilderRequest {
  ageRule?: string;
  attendanceMode?: AiAttendanceMode | string;
  audience?: string;
  basePrice?: string;
  budget?: string;
  categoryId?: string;
  city?: string;
  country?: string;
  currency?: string;
  currencyLabel?: string;
  dateHint?: string;
  endTime?: string;
  expectedGuests?: number;
  goals?: string[];
  onlineAccessInstructions?: string;
  onlinePlatform?: string;
  onlineTimezone?: string;
  prompt: string;
  startTime?: string;
  state?: string;
  stateId?: string;
  tags?: string;
  ticketName?: string;
  ticketPlan?: string;
  tone?: string;
}

export interface AiAutomationRule {
  action: string;
  channel: AiAutomationChannel;
  enabled: boolean;
  id: string;
  name: string;
  timing: string;
  trigger: string;
}

export interface AiEventQuality {
  missing: string[];
  score: number;
  strengths: string[];
  warnings: string[];
}

export interface AiEditSuggestion {
  area: string;
  priority: AiSuggestionPriority;
  suggestion: string;
}

export interface AiEventDraft {
  automationRules: AiAutomationRule[];
  details: Record<string, unknown>;
  editSuggestions: AiEditSuggestion[];
  enhancements: Record<string, unknown>;
  media: Record<string, unknown>;
  quality: AiEventQuality;
  tickets: Record<string, unknown>;
}

export interface AiSuggestRequest {
  draft: AiEventDraft | unknown;
  focus?: string;
}

export interface AiSuggestResponse {
  editSuggestions?: AiEditSuggestion[];
  quality?: Partial<AiEventQuality>;
  rewrittenFields?: Record<string, unknown>;
}
