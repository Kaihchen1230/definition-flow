import { useEffect } from "react";
import { useExecuteRequestActionMutation, usePatchRequestDataMutation } from "../../services/approvalApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getPath } from "../../utils/objectPath";
import { collectDataPaths } from "../../utils/uiNode";
import { RenderNode } from "../request-renderer/RenderNode";
import type { EvaluatedUi, UiNode } from "../../types/api";
import { ActionMessage } from "./ActionMessage";
import { StatusBar } from "./StatusBar";
import { TracePanel } from "./TracePanel";
import { ValidationSummary } from "./ValidationSummary";
import { WorkflowActions } from "./WorkflowActions";
import { enableValidationMode, setDraft } from "./requestWorkbenchSlice";

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

  useEffect(() => {
    dispatch(setDraft(evaluated.requestData));
  }, [dispatch, evaluated.requestData]);

  const visiblePages = evaluated.pages.filter((page) => page.visible);
  const pageDataPaths = selectedPage ? collectDataPaths(selectedPage) : [];
  const canSavePage = evaluated.canSave && pageDataPaths.length > 0;
  const savePage = () => {
    patchRequest({
      requestCaseId: evaluated.requestCaseId,
      userId,
      updates: pageDataPaths.map((path) => ({ path, value: getPath(draft, path) })),
    });
  };
  const runAction = (actionId: string) => {
    if (actionId.startsWith("workflow.submit")) {
      dispatch(enableValidationMode());
    }
    runRequestAction({ requestCaseId: evaluated.requestCaseId, userId, actionId });
  };

  return (
    <div className={`workbench-grid ${showEvaluationTrace ? "" : "without-trace"}`}>
      <aside className="panel nav-panel">
        <div className="nav-label">Request pages</div>
        {visiblePages.map((page) => (
          <button
            key={page.id}
            className={`nav-item ${selectedPageId === page.id ? "active" : ""}`}
            onClick={() => setSelectedPageId(page.id)}
          >
            {page.label}
          </button>
        ))}
      </aside>

      <section className="min-w-0 space-y-3">
        <StatusBar evaluated={evaluated} />
        {validationMode && <ValidationSummary evaluated={evaluated} />}
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
                Save page
              </button>
            </div>
            <div className="content-stack">
              {(selectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={(value) => dispatch(setDraft(typeof value === "function" ? value(draft) : value))} userRole={evaluated.user.role} runAction={runAction} />
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
