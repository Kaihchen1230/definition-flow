import { useCallback, useEffect, useMemo, useState } from "react";
import { useExecuteRequestActionMutation, usePatchRequestDataMutation } from "../../services/approvalApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { UiNavigationGroup } from "../../config/uiDefinition";
import { evaluateUiDefinition } from "../../utils/evaluateUiDefinition";
import { getPath } from "../../utils/objectPath";
import { evaluatePageCompletion } from "../../utils/pageCompletion";
import {
  deriveVisibleNavigationGroups,
  findAdjacentPageId,
  findNavigationGroupId,
  flattenNavigationPages,
} from "../../utils/pageNavigation";
import { collectDataPaths } from "../../utils/uiNode";
import { RenderNode } from "../request-renderer/RenderNode";
import type { EvaluatedUi, UiNode } from "../../types/api";
import { ActionMessage } from "./ActionMessage";
import { StatusBar } from "./StatusBar";
import { TracePanel } from "./TracePanel";
import { WorkflowActions } from "./WorkflowActions";
import { enableValidationMode, setDraft, setHasUnsavedChanges } from "./requestWorkbenchSlice";
import { evaluateFrontendContext } from "../../rules/evaluateFrontendContext";

type RequestWorkbenchProps = {
  evaluated: EvaluatedUi;
  navigationGroups: UiNavigationGroup[];
  selectedPage?: UiNode;
  selectedPageId: string | null;
  setSelectedPageId: (id: string) => void;
  userId: string;
  showEvaluationTrace?: boolean;
};

export const RequestWorkbench = ({ evaluated, navigationGroups, selectedPage, selectedPageId, setSelectedPageId, userId, showEvaluationTrace = true }: RequestWorkbenchProps) => {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.requestWorkbench.draft);
  const validationMode = useAppSelector((state) => state.requestWorkbench.validationMode);
  const [patchRequest, save] = usePatchRequestDataMutation();
  const [runRequestAction, action] = useExecuteRequestActionMutation();
  const [operationError, setOperationError] = useState<string | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const definitionKey = useMemo(
    () => navigationGroups.map((group) => `${group.id}:${group.pages.map((page) => page.id).join(",")}`).join("|"),
    [navigationGroups]
  );

  useEffect(() => {
    dispatch(setDraft(evaluated.requestData));
  }, [dispatch, evaluated.requestData]);

  const draftEvaluation = useMemo(() => evaluateFrontendContext({
    requestCaseId: evaluated.requestCaseId,
    requestType: evaluated.requestType,
    workflowState: evaluated.workflowState,
    user: evaluated.user,
    requestData: evaluated.requestData,
    calculations: evaluated.calculations,
    definitionVersions: evaluated.definitionVersions,
    workflowActions: evaluated.workflowActions.map(({ id, label }) => ({
      id,
      label,
    })),
  }, draft), [draft, evaluated]);
  const pagesConfig = useMemo(() => flattenNavigationPages(navigationGroups), [navigationGroups]);
  const draftPages = useMemo(() => evaluateUiDefinition(pagesConfig, draftEvaluation), [draftEvaluation, pagesConfig]);
  const visiblePages = draftPages.filter((page) => page.visible);
  const draftSelectedPage = visiblePages.find((page) => page.id === selectedPageId) ?? selectedPage;
  const pageCompletion = useMemo(() => new Map(visiblePages.map((page) => [page.id, evaluatePageCompletion(page, draft)])), [draft, visiblePages]);
  const visibleNavigationGroups = useMemo(
    () => deriveVisibleNavigationGroups(navigationGroups, draftPages, pageCompletion),
    [draftPages, navigationGroups, pageCompletion]
  );
  const activeGroupId = findNavigationGroupId(visibleNavigationGroups, selectedPageId);
  const previousPageId = findAdjacentPageId(visibleNavigationGroups, selectedPageId, -1);
  const nextPageId = findAdjacentPageId(visibleNavigationGroups, selectedPageId, 1);
  const firstIncompletePage = visiblePages.find((page) => !pageCompletion.get(page.id)?.complete);
  const pageDataPaths = useMemo(() => (draftSelectedPage ? collectDataPaths(draftSelectedPage) : []), [draftSelectedPage]);
  const pageDraftSnapshot = useMemo(() => JSON.stringify(pageDataPaths.map((path) => [path, getPath(draft, path)])), [draft, pageDataPaths]);
  const savedPageSnapshot = useMemo(() => JSON.stringify(pageDataPaths.map((path) => [path, getPath(evaluated.requestData, path)])), [evaluated.requestData, pageDataPaths]);
  const selectedCompletion = draftSelectedPage ? pageCompletion.get(draftSelectedPage.id) : undefined;
  const canSavePage = draftEvaluation.canSave && pageDataPaths.length > 0;
  const selectedPageHasUnsavedChanges = canSavePage && pageDraftSnapshot !== savedPageSnapshot;
  useEffect(() => {
    dispatch(setHasUnsavedChanges(selectedPageHasUnsavedChanges));
  }, [dispatch, selectedPageHasUnsavedChanges]);
  useEffect(() => {
    setExpandedGroupIds(new Set());
  }, [definitionKey, evaluated.requestCaseId, userId]);
  const savePage = useCallback(async () => {
    if (!canSavePage) {
      return false;
    }
    setOperationError(null);
    try {
      const result = await patchRequest({
        requestCaseId: evaluated.requestCaseId,
        userId,
        updates: pageDataPaths.map((path) => ({ path, value: getPath(draft, path) })),
      }).unwrap() as { success?: boolean };
      if (result.success !== false) {
        dispatch(setHasUnsavedChanges(false));
      } else {
        setOperationError("Page could not be saved. Try again.");
      }
      return result.success !== false;
    } catch {
      setOperationError("Page could not be saved. Try again.");
      return false;
    }
  }, [canSavePage, dispatch, draft, evaluated.requestCaseId, pageDataPaths, patchRequest, userId]);
  const selectPage = async (id: string) => {
    if (id === selectedPageId) {
      return true;
    }
    if (selectedPageHasUnsavedChanges) {
      const saved = await savePage();
      if (!saved) {
        return false;
      }
    }
    setSelectedPageId(id);
    return true;
  };
  const selectGroup = async (groupId: string, firstPageId: string) => {
    if (groupId === activeGroupId) {
      return;
    }
    if (expandedGroupIds.has(groupId)) {
      setExpandedGroupIds((current) => {
        const next = new Set(current);
        next.delete(groupId);
        return next;
      });
      return;
    }
    const navigated = await selectPage(firstPageId);
    if (navigated) {
      setExpandedGroupIds((current) => new Set(current).add(groupId));
    }
  };
  const runAction = async (actionId: string) => {
    setOperationError(null);
    const validationScope = scopeForAction(actionId);
    if (validationScope) {
      dispatch(enableValidationMode());
      const firstIssuePageId = draftEvaluation.validation[validationScope][0]?.pageId;
      const blockingPage = firstIncompletePage ?? visiblePages.find((page) => page.id === firstIssuePageId);
      if (blockingPage) {
        if (actionId !== START_INVESTMENT_REVIEW_ACTION_ID) {
          void selectPage(blockingPage.id);
        }
        return;
      }
    }
    if (selectedPageHasUnsavedChanges) {
      const saved = await savePage();
      if (!saved) {
        return;
      }
    }
    try {
      await runRequestAction({ requestCaseId: evaluated.requestCaseId, userId, actionId }).unwrap();
    } catch {
      setOperationError("Workflow action failed. Try again.");
    }
  };

  return (
    <div className={`workbench-grid ${showEvaluationTrace ? "" : "without-trace"}`}>
      <aside className="panel nav-panel">
        <div className="nav-label">Request pages</div>
        {visibleNavigationGroups.map((group) => {
          const expanded = group.id === activeGroupId || expandedGroupIds.has(group.id);
          return (
            <div className="nav-group" key={group.id}>
              <button
                className={`nav-group-button ${group.id === activeGroupId ? "active" : ""} ${group.complete ? "complete" : "incomplete"}`}
                aria-expanded={expanded}
                aria-label={`${group.label}, ${group.complete ? "complete" : "incomplete"}`}
                onClick={() => void selectGroup(group.id, group.pages[0].id)}
                title={group.complete ? "All pages complete" : `${group.missingCount} required field${group.missingCount === 1 ? "" : "s"} missing`}
              >
                <span className="nav-group-chevron" aria-hidden="true">{expanded ? "▾" : "›"}</span>
                <span className="nav-item-label">{group.label}</span>
                <PageStatusIcon complete={group.complete} decorative />
              </button>
              {expanded ? (
                <div className="nav-group-pages">
                  {group.pages.map((page) => {
                    const completion = pageCompletion.get(page.id);
                    return (
                      <button
                        key={page.id}
                        className={`nav-item ${selectedPageId === page.id ? "active" : ""} ${completion?.complete ? "complete" : "incomplete"}`}
                        onClick={() => void selectPage(page.id)}
                        title={completion?.complete ? "Complete" : `${completion?.missingCount ?? 0} required field${completion?.missingCount === 1 ? "" : "s"} missing`}
                      >
                        <span className="nav-item-label">{page.label}</span>
                        <PageStatusIcon complete={completion?.complete ?? true} />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </aside>

      <section className="min-w-0 space-y-3">
        <StatusBar evaluated={{ ...draftEvaluation, pages: draftPages }} />
        <WorkflowActions actions={draftEvaluation.workflowActions} runAction={runAction} pending={action.isLoading} />
        {operationError ? <div className="notice danger" role="alert">{operationError}</div> : null}
        {action.data ? <ActionMessage result={action.data as { success: boolean; message: string }} /> : null}
        {draftSelectedPage && (
          <div className="panel content-panel">
            <div className="content-panel-header">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Current page</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em]">{draftSelectedPage.label}</h2>
              </div>
              <button className="button" onClick={savePage} disabled={save.isLoading || !canSavePage}>
                {save.isLoading ? "Saving..." : "Save page"}
              </button>
            </div>
            <div className="content-stack">
              {(draftSelectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={(value) => dispatch(setDraft(typeof value === "function" ? value(draft) : value))} userId={evaluated.user.userId} userRole={evaluated.user.role} runAction={runAction} missingPaths={selectedCompletion?.missingPaths} validationActive={validationMode} />
              ))}
            </div>
            <div className="page-navigation-actions">
              <button className="button secondary" onClick={() => previousPageId && void selectPage(previousPageId)} disabled={!previousPageId}>
                Back
              </button>
              <button className="button" onClick={() => nextPageId && void selectPage(nextPageId)} disabled={!nextPageId}>
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {showEvaluationTrace && (
        <aside className="min-w-0">
          <TracePanel pages={draftPages} />
        </aside>
      )}
    </div>
  );
};

const PageStatusIcon = ({ complete, decorative = false }: { complete: boolean; decorative?: boolean }) => (
  <span
    className={`page-status-icon ${complete ? "complete" : "incomplete"}`}
    aria-hidden={decorative || undefined}
    aria-label={decorative ? undefined : (complete ? "Page complete" : "Page incomplete")}
    role={decorative ? undefined : "img"}
  >
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

const START_INVESTMENT_REVIEW_ACTION_ID = "workflow.startInvestmentReview";

const scopeForAction = (actionId: string): "submit" | "riskSubmit" | "approve" | null => {
  if (actionId === START_INVESTMENT_REVIEW_ACTION_ID || actionId.startsWith("workflow.submitInvestmentReview") || actionId.startsWith("workflow.approveInvestment")) return "submit";
  if (actionId.startsWith("workflow.submitRiskReview")) return "riskSubmit";
  if (actionId.startsWith("workflow.approveRisk")) return "approve";
  return null;
};
