import type { ApiSuccessResponse } from "@/types/api";
import type {
  AttachQuestionnaireItem,
  EventQuestionnaireItem,
  QuestionBankItem,
  QuestionnaireResponsesBody,
} from "@/types/questionnaire";
import { apiSlice } from "./apiSlice";

type EventId = string | number;

export const questionnaireApiSlice = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    getQuestionBank: builder.query<ApiSuccessResponse<QuestionBankItem[]>, void>({
      query: () => ({
        url: "question-bank",
        method: "GET",
      }),
      providesTags: ["Questionnaire"],
    }),
    getQuestionnaireForEvent: builder.query<
      ApiSuccessResponse<EventQuestionnaireItem[]>,
      EventId
    >({
      query: (eventId) => ({
        url: "event-questionnaire",
        method: "GET",
        params: { eventId: String(eventId), includeHidden: "false" },
      }),
      providesTags: (_result, _error, eventId) => [
        { type: "Questionnaire", id: eventId },
      ],
    }),
    attachQuestionnaire: builder.mutation<
      ApiSuccessResponse<unknown>,
      { eventId: EventId; items: AttachQuestionnaireItem[] }
    >({
      query: ({ eventId, items }) => ({
        url: "event-questionnaire/bulk",
        method: "POST",
        body: { eventId: Number(eventId), items },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        "Questionnaire",
        { type: "Questionnaire", id: eventId },
      ],
    }),
    getQuestionnaireResponses: builder.query<
      ApiSuccessResponse<QuestionnaireResponsesBody>,
      EventId
    >({
      query: (eventId) => ({
        url: `questionnaire/event/${eventId}/responses`,
        method: "GET",
      }),
      providesTags: (_result, _error, eventId) => [
        { type: "Questionnaire", id: `responses-${eventId}` },
      ],
    }),
    getEventQuestionnaire: builder.query<ApiSuccessResponse<unknown>, string>({
      query: (responseId) => ({
        url: `questionnaire/${responseId}/questions`,
        method: "GET",
      }),
      providesTags: (_result, _error, responseId) => [
        { type: "Questionnaire", id: responseId },
      ],
    }),
    submitQuestionnaireAnswers: builder.mutation<
      ApiSuccessResponse<unknown>,
      { answers: Array<{ answer: unknown; questionId: string }>; responseId: string }
    >({
      query: ({ responseId, answers }) => ({
        url: `questionnaire/${responseId}/answers`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: (_result, _error, { responseId }) => [
        { type: "Questionnaire", id: responseId },
      ],
    }),
  }),
});

export const {
  useAttachQuestionnaireMutation,
  useGetEventQuestionnaireQuery,
  useGetQuestionBankQuery,
  useGetQuestionnaireForEventQuery,
  useGetQuestionnaireResponsesQuery,
  useSubmitQuestionnaireAnswersMutation,
} = questionnaireApiSlice;
