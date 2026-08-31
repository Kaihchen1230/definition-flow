import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { frontendRuleCatalogVersion } from "../config/appConstants";
import type { CreatedRequest, DemoRequest, User, RawEvaluationContext, RequestDataUpdate } from "../types/api";

const apiBaseUrl = typeof window === "undefined" ? "/" : `${window.location.origin}/`;

export const approvalApi = createApi({
  reducerPath: "approvalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      headers.set("X-Frontend-Rule-Catalog-Version", frontendRuleCatalogVersion);
      return headers;
    },
  }),
  tagTypes: ["Users", "DemoRequests", "EvaluationContext"],
  endpoints: (builder) => ({
    fetchDemoUsers: builder.query<User[], void>({
      query: () => "api/dev/demo/users",
      providesTags: ["Users"],
    }),
    fetchDemoRequests: builder.query<DemoRequest[], void>({
      query: () => "api/dev/demo/requests",
      providesTags: ["DemoRequests"],
    }),
    fetchEvaluationContext: builder.query<RawEvaluationContext, { requestCaseId: string; userId: string }>({
      query: ({ requestCaseId, userId }) => `api/request-cases/${requestCaseId}/evaluation-context?userId=${userId}`,
      providesTags: ["EvaluationContext"],
    }),
    createRequest: builder.mutation<CreatedRequest, { requestType: string; userId: string }>({
      query: ({ requestType, userId }) => ({
        url: `api/request-cases?userId=${userId}`,
        method: "POST",
        body: { requestType },
      }),
      invalidatesTags: ["DemoRequests"],
    }),
    resetDemoData: builder.mutation<unknown, void>({
      query: () => ({
        url: "api/dev/demo/reset",
        method: "POST",
      }),
      invalidatesTags: ["Users", "DemoRequests", "EvaluationContext"],
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
  useFetchDemoRequestsQuery,
  useFetchEvaluationContextQuery,
  useCreateRequestMutation,
  useResetDemoDataMutation,
  useReloadStartupInvestmentDefinitionsMutation,
  usePatchRequestDataMutation,
  useExecuteRequestActionMutation,
} = approvalApi;
