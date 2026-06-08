export type QuestionnaireResponseStatus = "SUBMITTED" | "PENDING" | string;

export interface QuestionBankItem {
  archived?: boolean;
  description?: string | null;
  id: string;
  isRequired?: boolean;
  label?: string;
  question?: string;
  section?: string | null;
  type: string;
}

export interface EventQuestionnaireItem {
  eventId?: number;
  id?: number;
  isHidden?: boolean;
  order?: number;
  question?: QuestionBankItem;
  questionId: string;
}

export interface AttachQuestionnaireItem {
  order: number;
  questionId: string;
}

export interface QuestionnaireHeader {
  id: string;
  label: string;
  question: string;
  type: string;
}

export interface QuestionnaireAnswerRow {
  answeredCount: number;
  answers: Record<string, string | string[] | number | boolean | null>;
  completionRate: number;
  id: string;
  status: QuestionnaireResponseStatus;
  submittedAt: string;
  ticket?: { name?: string | null };
  totalQuestions: number;
  user: { email?: string | null; name?: string | null };
}

export interface QuestionnaireQuestionInsight {
  emptyCount: number;
  id: string;
  label: string;
  numericSummary?: { average: number; max: number; min: number } | null;
  responseRate: number;
  topAnswers: Array<{ count: number; percentage: number; value: string }>;
  totalAnswers: number;
  type: string;
}

export interface QuestionnaireAnalytics {
  averageAnsweredQuestions: number;
  completionRate: number;
  pendingResponses: number;
  questionCount: number;
  questions: QuestionnaireQuestionInsight[];
  totalInvites: number;
  totalResponses: number;
}

export interface QuestionnaireResponsesBody {
  analytics: QuestionnaireAnalytics;
  event?: { id?: number; title?: string };
  questions: QuestionnaireHeader[];
  responses: QuestionnaireAnswerRow[];
}
