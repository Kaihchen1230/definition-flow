import { useEffect, useMemo } from "react";
import {
  useFetchDemoRequestsQuery,
  useFetchDemoUsersQuery,
  useFetchEvaluationContextQuery,
  useReloadStartupInvestmentDefinitionsMutation,
  useResetDemoDataMutation,
} from "../services/approvalApi";
import { startupInvestmentUiDefinition } from "../config/uiDefinition";
import { showEvaluationTrace } from "../config/appConstants";
import { RequestWorkbench } from "../features/request-workbench/RequestWorkbench";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setRequestCaseId, setUserId, setSelectedPageId } from "../features/request-workbench/requestWorkbenchSlice";
import { evaluateUiDefinition } from "../utils/evaluateUiDefinition";

export const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.requestWorkbench.userId);
  const requestCaseId = useAppSelector((state) => state.requestWorkbench.requestCaseId);
  const selectedPageId = useAppSelector((state) => state.requestWorkbench.selectedPageId);
  const users = useFetchDemoUsersQuery();
  const requests = useFetchDemoRequestsQuery();
  const evaluated = useFetchEvaluationContextQuery({ requestCaseId, userId });
  const [resetDemo] = useResetDemoDataMutation();
  const [reloadDefinitions] = useReloadStartupInvestmentDefinitionsMutation();

  const evaluatedUi = useMemo(() => {
    if (!evaluated.data) {
      return undefined;
    }
    return {
      ...evaluated.data,
      pages: evaluateUiDefinition(startupInvestmentUiDefinition.pages, evaluated.data),
    };
  }, [evaluated.data]);
  const visiblePages = useMemo(() => evaluatedUi?.pages.filter((page) => page.visible) ?? [], [evaluatedUi]);
  const selectedRequest = requests.data?.find((request) => request.id === requestCaseId);

  useEffect(() => {
    if (requests.data?.length && !requests.data.some((request) => request.id === requestCaseId)) {
      dispatch(setRequestCaseId(requests.data[0].id));
    }
  }, [dispatch, requestCaseId, requests.data]);

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
            <p className="app-kicker">Request-definition platform POC</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">Startup Investment Approval</h1>
              <span className="text-xs font-medium text-[var(--text-muted)]">Case {requestCaseId.slice(0, 8)}</span>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Role-aware review surface backed by server-side rules, workflow actions, validation, and audit trace.
            </p>
          </div>
          <div className="app-toolbar">
            <label className="toolbar-field toolbar-request-field">
              <span>Demo request</span>
              <select className="control" value={requestCaseId} onChange={(event) => dispatch(setRequestCaseId(event.target.value))}>
                {(requests.data ?? []).map((request) => (
                  <option value={request.id} key={request.id}>
                    {request.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field toolbar-user-field">
              <span>User</span>
              <select className="control" value={userId} onChange={(event) => dispatch(setUserId(event.target.value))}>
                {(users.data ?? []).map((user) => (
                  <option value={user.id} key={user.id}>
                    {user.displayName} ({formatRoleName(user.role)})
                  </option>
                ))}
              </select>
            </label>
            {selectedRequest ? <p className="toolbar-scenario">{selectedRequest.scenario}</p> : <span />}
            <div className="toolbar-actions">
              <button className="button secondary" onClick={() => reloadDefinitions()}>
                Reload definitions
              </button>
              <button className="button secondary" onClick={() => resetDemo()}>
                Reset demo
              </button>
            </div>
          </div>
        </header>

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

        {evaluatedUi && (
          <RequestWorkbench
            evaluated={evaluatedUi}
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
