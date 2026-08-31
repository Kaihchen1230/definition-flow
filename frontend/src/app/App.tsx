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
import { companyProfileIntakeDataPaths, RequestIntake } from "../features/request-intake/RequestIntake";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setRequestCaseId, setUserId, setSelectedPageId } from "../features/request-workbench/requestWorkbenchSlice";
import { evaluateUiDefinition } from "../utils/evaluateUiDefinition";
import { evaluateFrontendContext } from "../rules/evaluateFrontendContext";
import { getPath } from "../utils/objectPath";
import { flattenNavigationPages } from "../utils/pageNavigation";

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
  const selectedRequest = requests.data?.find((request) => request.id === requestCaseId);

  const createFromIntake = async (data: Record<string, any>) => {
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
        updates: companyProfileIntakeDataPaths.map((path) => ({ path, value: getPath(data, path) })),
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
        <header className="app-header">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Startup Investment Approval</h1>
              <span className="text-xs font-medium text-[var(--text-muted)]">{requestCaseId ? `Case ${requestCaseId.slice(0, 8)}` : "New request"}</span>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Create, review, and approve startup investment requests using the permissions of the selected user.
            </p>
          </div>
          <div className="app-toolbar">
            <label className="toolbar-field toolbar-request-field">
              <span>Request</span>
              <select className="control" value={requestCaseId} disabled={hasUnsavedChanges} onChange={(event) => dispatch(setRequestCaseId(event.target.value))}>
                {!requestCaseId ? <option value="">Open an existing request</option> : null}
                {(requests.data ?? []).map((request) => (
                  <option value={request.id} key={request.id}>
                    {formatRequestLabel(request)}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field toolbar-user-field">
              <span>User</span>
              <select className="control" value={userId} disabled={hasUnsavedChanges} onChange={(event) => dispatch(setUserId(event.target.value))}>
                {(users.data ?? []).map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.displayName} ({formatRoleName(user.role)})
                  </option>
                ))}
              </select>
            </label>
            {selectedRequest ? <p className="toolbar-scenario">{selectedRequest.scenario}</p> : <span />}
            <div className="toolbar-actions">
              {requestCaseId ? <button className="button" onClick={startNewRequest} disabled={hasUnsavedChanges}>New request</button> : null}
            </div>
          </div>
        </header>

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

const formatRoleName = (role: string) => {
  return role.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const formatRequestLabel = ({ companyName, id }: { companyName: string; id: string }) => `${companyName.trim() || "Untitled request"} (${id.slice(0, 8)})`;
