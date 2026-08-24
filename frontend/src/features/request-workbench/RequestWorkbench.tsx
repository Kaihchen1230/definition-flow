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
  actorId: string;
};

export const RequestWorkbench = ({ evaluated, selectedPage, selectedPageId, setSelectedPageId, actorId }: RequestWorkbenchProps) => {
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
      actorId,
      updates: pageDataPaths.map((path) => ({ path, value: getPath(draft, path) })),
    });
  };
  const runAction = (actionId: string) => {
    if (actionId.startsWith("workflow.submit")) {
      dispatch(enableValidationMode());
    }
    runRequestAction({ requestCaseId: evaluated.requestCaseId, actorId, actionId });
  };

  return (
    <div className="grid grid-cols-[230px_minmax(0,1fr)_360px] gap-4">
      <aside className="panel self-start p-2">
        <div className="px-2 pb-2 text-xs font-semibold uppercase text-slate-500">Pages</div>
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

      <section className="space-y-4">
        <StatusBar evaluated={evaluated} />
        {validationMode && <ValidationSummary evaluated={evaluated} />}
        <WorkflowActions actions={evaluated.workflowActions} runAction={runAction} pending={action.isLoading} />
        {action.data ? <ActionMessage result={action.data as { success: boolean; message: string }} /> : null}
        {selectedPage && (
          <div className="panel">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold">{selectedPage.label}</h2>
              <button className="button" onClick={savePage} disabled={save.isLoading || !canSavePage}>
                Save page
              </button>
            </div>
            <div className="space-y-4">
              {(selectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={(value) => dispatch(setDraft(typeof value === "function" ? value(draft) : value))} actorRole={evaluated.actor.role} runAction={runAction} />
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <TracePanel pages={evaluated.pages} />
      </aside>
    </div>
  );
};
