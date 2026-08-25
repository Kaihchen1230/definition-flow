import { useEffect, useMemo } from "react";
import {
  demoRequestId,
  useFetchDemoActorsQuery,
  useFetchEvaluationContextQuery,
  useReloadStartupInvestmentDefinitionsMutation,
  useResetDemoDataMutation,
} from "../services/approvalApi";
import { startupInvestmentUiDefinition } from "../config/uiDefinition";
import { RequestWorkbench } from "../features/request-workbench/RequestWorkbench";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setActorId, setSelectedPageId } from "../features/request-workbench/requestWorkbenchSlice";
import { evaluateUiDefinition } from "../utils/evaluateUiDefinition";

export const App = () => {
  const dispatch = useAppDispatch();
  const actorId = useAppSelector((state) => state.requestWorkbench.actorId);
  const selectedPageId = useAppSelector((state) => state.requestWorkbench.selectedPageId);
  const actors = useFetchDemoActorsQuery();
  const evaluated = useFetchEvaluationContextQuery({ requestCaseId: demoRequestId, actorId });
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">Startup Investment Approval</h1>
            <p className="mt-1 text-sm text-slate-600">
              Definition-driven approval request POC. Backend evaluates rules; React owns the UI layout.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="control w-64" value={actorId} onChange={(event) => dispatch(setActorId(event.target.value))}>
              {(actors.data ?? []).map((actor) => (
                <option value={actor.id} key={actor.id}>
                  {actor.displayName} ({actor.role})
                </option>
              ))}
            </select>
            <button className="button secondary" onClick={() => reloadDefinitions()}>
              Reload definitions
            </button>
            <button className="button secondary" onClick={() => resetDemo()}>
              Reset demo
            </button>
          </div>
        </header>

        {evaluated.isLoading && <div className="panel">Loading request context...</div>}
        {evaluated.error && <div className="panel border-red-300 text-red-700">Backend not ready. Start backend, load definitions, then reset demo data.</div>}

        {evaluatedUi && (
          <RequestWorkbench
            evaluated={evaluatedUi}
            selectedPage={selectedPage}
            selectedPageId={selectedPageId}
            setSelectedPageId={(id) => dispatch(setSelectedPageId(id))}
            actorId={actorId}
          />
        )}
      </div>
    </main>
  );
};
