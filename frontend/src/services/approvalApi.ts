import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Actor, EvaluatedUi } from "../types/api";

export const demoRequestId = "11111111-1111-1111-1111-111111111111";

export const approvalApi = createApi({
  reducerPath: "approvalApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  tagTypes: ["Actors", "EvaluatedUi"],
  endpoints: (builder) => ({
    fetchDemoActors: builder.query<Actor[], void>({
      query: () => "api/dev/demo/actors",
      providesTags: ["Actors"],
    }),
    fetchEvaluatedUi: builder.query<EvaluatedUi, { requestCaseId: string; actorId: string }>({
      query: ({ requestCaseId, actorId }) => `api/request-cases/${requestCaseId}/evaluated-ui?actorId=${actorId}`,
      providesTags: ["EvaluatedUi"],
    }),
    resetDemoData: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/demo/reset",
        method: "POST",
      }),
      invalidatesTags: ["Actors", "EvaluatedUi"],
    }),
    reloadStartupInvestmentDefinitions: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/definitions/reload/startup-investment",
        method: "POST",
      }),
      invalidatesTags: ["EvaluatedUi"],
    }),
    saveRequestData: builder.mutation<unknown, { requestCaseId: string; actorId: string; requestData: Record<string, any> }>({
      query: ({ requestCaseId, actorId, requestData }) => ({
        url: `api/request-cases/${requestCaseId}/request-data?actorId=${actorId}`,
        method: "PUT",
        body: requestData,
      }),
      invalidatesTags: ["EvaluatedUi"],
    }),
    executeRequestAction: builder.mutation<unknown, { requestCaseId: string; actorId: string; actionId: string }>({
      query: ({ requestCaseId, actorId, actionId }) => ({
        url: `api/request-cases/${requestCaseId}/actions/${actionId}?actorId=${actorId}`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["EvaluatedUi"],
    }),
  }),
});

export const {
  useFetchDemoActorsQuery,
  useFetchEvaluatedUiQuery,
  useResetDemoDataMutation,
  useReloadStartupInvestmentDefinitionsMutation,
  useSaveRequestDataMutation,
  useExecuteRequestActionMutation,
} = approvalApi;
