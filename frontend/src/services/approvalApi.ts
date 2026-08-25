import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User, EvaluationContext, RequestDataUpdate } from "../types/api";

export const demoRequestId = "11111111-1111-1111-1111-111111111111";
const apiBaseUrl = typeof window === "undefined" ? "/" : `${window.location.origin}/`;

export const approvalApi = createApi({
  reducerPath: "approvalApi",
  baseQuery: fetchBaseQuery({ baseUrl: apiBaseUrl }),
  tagTypes: ["Users", "EvaluationContext"],
  endpoints: (builder) => ({
    fetchDemoUsers: builder.query<User[], void>({
      query: () => "api/dev/demo/users",
      providesTags: ["Users"],
    }),
    fetchEvaluationContext: builder.query<EvaluationContext, { requestCaseId: string; userId: string }>({
      query: ({ requestCaseId, userId }) => `api/request-cases/${requestCaseId}/evaluation-context?userId=${userId}`,
      providesTags: ["EvaluationContext"],
    }),
    resetDemoData: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/demo/reset",
        method: "POST",
      }),
      invalidatesTags: ["Users", "EvaluationContext"],
    }),
    reloadStartupInvestmentDefinitions: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/definitions/reload/startup-investment",
        method: "POST",
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
    patchRequestData: builder.mutation<unknown, { requestCaseId: string; userId: string; updates: RequestDataUpdate[] }>({
      query: ({ requestCaseId, userId, updates }) => ({
        url: `api/request-cases/${requestCaseId}/request-data?userId=${userId}`,
        method: "PATCH",
        body: { updates },
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
    executeRequestAction: builder.mutation<unknown, { requestCaseId: string; userId: string; actionId: string }>({
      query: ({ requestCaseId, userId, actionId }) => ({
        url: `api/request-cases/${requestCaseId}/actions/${actionId}?userId=${userId}`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["EvaluationContext"],
    }),
  }),
});

export const {
  useFetchDemoUsersQuery,
  useFetchEvaluationContextQuery,
  useResetDemoDataMutation,
  useReloadStartupInvestmentDefinitionsMutation,
  usePatchRequestDataMutation,
  useExecuteRequestActionMutation,
} = approvalApi;
