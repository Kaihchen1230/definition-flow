import { api } from "./client";
import type { EvaluatedUi } from "../types/api";

export const fetchEvaluatedUi = (requestCaseId: string, actorId: string) => {
  return api<EvaluatedUi>(`/api/request-cases/${requestCaseId}/evaluated-ui?actorId=${actorId}`);
};

export const saveRequestData = (requestCaseId: string, actorId: string, requestData: Record<string, any>) => {
  return api(`/api/request-cases/${requestCaseId}/request-data?actorId=${actorId}`, {
    method: "PUT",
    body: JSON.stringify(requestData),
  });
};

export const executeRequestAction = (requestCaseId: string, actorId: string, actionId: string) => {
  return api(`/api/request-cases/${requestCaseId}/actions/${actionId}?actorId=${actorId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
};
