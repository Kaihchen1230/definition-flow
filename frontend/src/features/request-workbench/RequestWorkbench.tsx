import { useCallback, useEffect, useMemo, useRef } from "react";
import { useExecuteRequestActionMutation, usePatchRequestDataMutation } from "../../services/approvalApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getPath } from "../../utils/objectPath";
import { evaluatePageCompletion } from "../../utils/pageCompletion";
import { collectDataPaths } from "../../utils/uiNode";
import { RenderNode } from "../request-renderer/RenderNode";
import type { EvaluatedUi, UiNode } from "../../types/api";
import { ActionMessage } from "./ActionMessage";
import { StatusBar } from "./StatusBar";
import { TracePanel } from "./TracePanel";
import { WorkflowActions } from "./WorkflowActions";
import { enableValidationMode, setDraft } from "./requestWorkbenchSlice";

const autoSaveDelayMs = 600;

type RequestWorkbenchProps = {
  evaluated: EvaluatedUi;
  selectedPage?: UiNode;
  selectedPageId: string | null;
  setSelectedPageId: (id: string) => void;
  userId: string;
  showEvaluationTrace?: boolean;
};

export const RequestWorkbench = ({ evaluated, selectedPage, selectedPageId, setSelectedPageId, userId, showEvaluationTrace = true }: RequestWorkbenchProps) => {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.requestWorkbench.draft);
  const validationMode = useAppSelector((state) => state.requestWorkbench.validationMode);
  const [patchRequest, save] = usePatchRequestDataMutation();
  const [runRequestAction, action] = useExecuteRequestActionMutation();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(setDraft(evaluated.requestData));
  }, [dispatch, evaluated.requestData]);

  const visiblePages = evaluated.pages.filter((page) => page.visible);
  const pageCompletion = useMemo(() => new Map(visiblePages.map((page) => [page.id, evaluatePageCompletion(page, draft)])), [draft, visiblePages]);
  const firstIncompletePage = visiblePages.find((page) => !pageCompletion.get(page.id)?.complete);
  const pageDataPaths = useMemo(() => (selectedPage ? collectDataPaths(selectedPage) : []), [selectedPage]);
  const pageDraftSnapshot = useMemo(() => JSON.stringify(pageDataPaths.map((path) => [path, getPath(draft, path)])), [draft, pageDataPaths]);
  const savedPageSnapshot = useMemo(() => JSON.stringify(pageDataPaths.map((path) => [path, getPath(evaluated.requestData, path)])), [evaluated.requestData, pageDataPaths]);
  const selectedCompletion = selectedPage ? pageCompletion.get(selectedPage.id) : undefined;
  const canSavePage = evaluated.canSave && pageDataPaths.length > 0;
  const selectedPageHasUnsavedChanges = canSavePage && pageDraftSnapshot !== savedPageSnapshot;
  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
  }, []);
  const savePage = useCallback(() => {
    if (!canSavePage) {
      return;
    }
    patchRequest({
      requestCaseId: evaluated.requestCaseId,
      userId,
      updates: pageDataPaths.map((path) => ({ path, value: getPath(draft, path) })),
    });
  }, [canSavePage, draft, evaluated.requestCaseId, pageDataPaths, patchRequest, userId]);
  useEffect(() => {
    if (!selectedPageHasUnsavedChanges || save.isLoading) {
      return clearAutoSaveTimer;
    }
    clearAutoSaveTimer();
    autoSaveTimer.current = setTimeout(() => {
      autoSaveTimer.current = null;
      savePage();
    }, autoSaveDelayMs);
    return clearAutoSaveTimer;
  }, [clearAutoSaveTimer, save.isLoading, savePage, selectedPageHasUnsavedChanges]);
  const selectPage = (id: string) => {
    if (selectedPageHasUnsavedChanges) {
      clearAutoSaveTimer();
      savePage();
    }
    setSelectedPageId(id);
  };
  const runAction = (actionId: string) => {
    if (actionId.startsWith("workflow.submit")) {
      dispatch(enableValidationMode());
      if (firstIncompletePage) {
        selectPage(firstIncompletePage.id);
        return;
      }
    }
    runRequestAction({ requestCaseId: evaluated.requestCaseId, userId, actionId });
  };

  return (
    <div className={`workbench-grid ${showEvaluationTrace ? "" : "without-trace"}`}>
      <aside className="panel nav-panel">
        <div className="nav-label">Request pages</div>
        {visiblePages.map((page) => {
          const completion = pageCompletion.get(page.id);
          return (
            <button
              key={page.id}
              className={`nav-item ${selectedPageId === page.id ? "active" : ""} ${completion?.complete ? "complete" : "incomplete"}`}
              onClick={() => selectPage(page.id)}
              title={completion?.complete ? "Complete" : `${completion?.missingCount ?? 0} required field${completion?.missingCount === 1 ? "" : "s"} missing`}
            >
              <span className="nav-item-label">{page.label}</span>
              <PageStatusIcon complete={completion?.complete ?? true} />
            </button>
          );
        })}
      </aside>

      <section className="min-w-0 space-y-3">
        <StatusBar evaluated={evaluated} />
        <WorkflowActions actions={evaluated.workflowActions} runAction={runAction} pending={action.isLoading} />
        {action.data ? <ActionMessage result={action.data as { success: boolean; message: string }} /> : null}
        {selectedPage && (
          <div className="panel content-panel">
            <div className="content-panel-header">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Current page</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em]">{selectedPage.label}</h2>
              </div>
              <button className="button" onClick={savePage} disabled={save.isLoading || !canSavePage}>
                {save.isLoading ? "Saving..." : "Save page"}
              </button>
            </div>
            <div className="content-stack">
              {(selectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={(value) => dispatch(setDraft(typeof value === "function" ? value(draft) : value))} userRole={evaluated.user.role} runAction={runAction} missingPaths={selectedCompletion?.missingPaths} validationActive={validationMode} />
              ))}
            </div>
          </div>
        )}
      </section>

      {showEvaluationTrace && (
        <aside className="min-w-0">
          <TracePanel pages={evaluated.pages} />
        </aside>
      )}
    </div>
  );
};

const PageStatusIcon = ({ complete }: { complete: boolean }) => (
  <span className={`page-status-icon ${complete ? "complete" : "incomplete"}`} aria-label={complete ? "Page complete" : "Page incomplete"} role="img">
    {complete ? (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.25 8.15 6.55 11.4l6.2-7.05" />
      </svg>
    ) : (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 4.1v4.7" />
        <path d="M8 11.9h.01" />
        <circle cx="8" cy="8" r="6" />
      </svg>
    )}
  </span>
);
