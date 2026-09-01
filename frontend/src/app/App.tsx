import { useEffect, useMemo, useState } from "react";
import {
  useFetchDemoRequestsQuery,
  useFetchDemoUsersQuery,
  useFetchEvaluationContextQuery,
  useCreateRequestMutation,
  usePatchRequestDataMutation,
} from "../services/approvalApi";
import { startupInvestmentUiDefinition } from "../config/uiDefinition";
import { showEvaluationTrace } from "../config/appConstants";
import { RequestWorkbench } from "../features/request-workbench/RequestWorkbench";
import { RequestIntake } from "../features/request-intake/RequestIntake";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setRequestCaseId, setUserId, setSelectedPageId } from "../features/request-workbench/requestWorkbenchSlice";
import { evaluateUiDefinition } from "../utils/evaluateUiDefinition";
import { evaluateFrontendContext } from "../rules/evaluateFrontendContext";
import { getPath } from "../utils/objectPath";
import { flattenNavigationPages } from "../utils/pageNavigation";
import { AppHeader } from "./AppHeader";

export const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.requestWorkbench.userId);
  const requestCaseId = useAppSelector((state) => state.requestWorkbench.requestCaseId);
  const selectedPageId = useAppSelector((state) => state.requestWorkbench.selectedPageId);
  const hasUnsavedChanges = useAppSelector((state) => state.requestWorkbench.hasUnsavedChanges);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const users = useFetchDemoUsersQuery();
  const requests = useFetchDemoRequestsQuery();
  const evaluated = useFetchEvaluationContextQuery({ requestCaseId, userId }, { skip: !requestCaseId });
  const [createRequest, create] = useCreateRequestMutation();
  const [patchRequest, patch] = usePatchRequestDataMutation();

  const evaluatedUi = useMemo(() => {
    if (!evaluated.data) {
      return undefined;
    }
    const frontendEvaluation = evaluateFrontendContext(evaluated.data);
    return { ...frontendEvaluation, pages: evaluateUiDefinition(flattenNavigationPages(startupInvestmentUiDefinition.groups), frontendEvaluation) };
  }, [evaluated.data]);
  const visiblePages = useMemo(() => evaluatedUi?.pages.filter((page) => page.visible) ?? [], [evaluatedUi]);
  const createFromIntake = async (data: Record<string, any>, dataPaths: string[]) => {
    setIntakeError(null);
    let requestId = pendingRequestId;
    try {
      if (!requestId) {
        const created = await createRequest({ requestType: "startupInvestment", userId }).unwrap();
        requestId = created.id;
        setPendingRequestId(requestId);
      }
      const result = await patchRequest({
        requestCaseId: requestId,
        userId,
        updates: dataPaths.map((path) => ({ path, value: getPath(data, path) })),
      }).unwrap() as { success?: boolean };
      if (result.success === false) {
        throw new Error("Page patch was rejected");
      }
      await requests.refetch().unwrap();
      dispatch(setRequestCaseId(requestId));
      setPendingRequestId(null);
    } catch {
      setIntakeError(requestId
        ? "The request was created, but its company profile could not be saved. Try again to finish setup."
        : "The request could not be created. Confirm that the backend definitions and demo users are loaded.");
    }
  };

  const startNewRequest = () => {
    setIntakeError(null);
    setPendingRequestId(null);
    dispatch(setRequestCaseId(""));
  };

  useEffect(() => {
    if (!selectedPageId && visiblePages.length > 0) {
      dispatch(setSelectedPageId(visiblePages[0].id));
    }
    if (selectedPageId && visiblePages.length > 0 && !visiblePages.some((page) => page.id === selectedPageId)) {
      dispatch(setSelectedPageId(visiblePages[0].id));
    }
  }, [dispatch, selectedPageId, visiblePages]);

  const selectedPage = visiblePages.find((page) => page.id === selectedPageId) ?? visiblePages[0];
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6">
        <AppHeader
          hasUnsavedChanges={hasUnsavedChanges}
          onRequestChange={(id) => dispatch(setRequestCaseId(id))}
          onStartNewRequest={startNewRequest}
          onUserChange={(id) => dispatch(setUserId(id))}
          requestCaseId={requestCaseId}
          requests={requests.data ?? []}
          userId={userId}
          users={users.data ?? []}
        />

        {hasUnsavedChanges && <div className="notice">Save the current page before switching request or user.</div>}

        {evaluated.isLoading && (
          <div className="panel">
            <div className="skeleton-line w-64" />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
            </div>
          </div>
        )}
        {evaluated.error && (
          <div className="notice danger">
            Backend not ready. Start the backend, load definitions, then reset demo data.
          </div>
        )}
        {!requestCaseId && users.data ? (
          <RequestIntake
            userId={userId}
            userRole={users.data.find((user) => user.id === userId)?.role ?? "InvestmentAnalyst"}
            pending={create.isLoading || patch.isLoading}
            error={intakeError}
            onCreate={createFromIntake}
          />
        ) : null}

        {requestCaseId && evaluatedUi && (
          <RequestWorkbench
            evaluated={evaluatedUi}
            navigationGroups={startupInvestmentUiDefinition.groups}
            selectedPage={selectedPage}
            selectedPageId={selectedPageId}
            setSelectedPageId={(id) => dispatch(setSelectedPageId(id))}
            userId={userId}
            showEvaluationTrace={showEvaluationTrace}
          />
        )}
      </div>
    </main>
  );
};
