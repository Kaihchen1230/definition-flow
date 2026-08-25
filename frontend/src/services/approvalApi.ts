import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Actor, EvaluationContext, RequestDataUpdate } from "../types/api";

export const demoRequestId = "11111111-1111-1111-1111-111111111111";
const apiBaseUrl = typeof window === "undefined" ? "/" : `${window.location.origin}/`;

export const approvalApi = createApi({
  reducerPath: "approvalApi",
  baseQuery: fetchBaseQuery({ baseUrl: apiBaseUrl }),
  tagTypes: ["Actors", "EvaluationContext"],
  endpoints: (builder) => ({
    fetchDemoActors: builder.query<Actor[], void>({
      query: () => "api/dev/demo/actors",
      providesTags: ["Actors"],
    }),
    fetchEvaluationContext: builder.query<EvaluationContext, { requestCaseId: string; actorId: string }>({
      query: ({ requestCaseId, actorId }) => `api/request-cases/${requestCaseId}/evaluation-context?actorId=${actorId}`,
      providesTags: ["EvaluationContext"],
    }),
    resetDemoData: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/demo/reset",
        method: "POST",
      }),
      invalidatesTags: ["Actors", "EvaluationContext"],
    }),
    reloadStartupInvestmentDefinitions: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/definitions/reload/startup-investment",
        method: "POST",
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
    patchRequestData: builder.mutation<unknown, { requestCaseId: string; actorId: string; updates: RequestDataUpdate[] }>({
      query: ({ requestCaseId, actorId, updates }) => ({
        url: `api/request-cases/${requestCaseId}/request-data?actorId=${actorId}`,
        method: "PATCH",
        body: { updates },
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
    executeRequestAction: builder.mutation<unknown, { requestCaseId: string; actorId: string; actionId: string }>({
      query: ({ requestCaseId, actorId, actionId }) => ({
        url: `api/request-cases/${requestCaseId}/actions/${actionId}?actorId=${actorId}`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
  }),
});

export const {
  useFetchDemoActorsQuery,
  useFetchEvaluationContextQuery,
  useResetDemoDataMutation,
  useReloadStartupInvestmentDefinitionsMutation,
  usePatchRequestDataMutation,
  useExecuteRequestActionMutation,
} = approvalApi;
