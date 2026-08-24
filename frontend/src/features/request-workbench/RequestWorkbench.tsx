import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeRequestAction, saveRequestData } from "../../api/requestCases";
import { RenderNode } from "../request-renderer/RenderNode";
import type { EvaluatedUi, UiNode } from "../../types/api";
import { ActionMessage } from "./ActionMessage";
import { StatusBar } from "./StatusBar";
import { TracePanel } from "./TracePanel";
import { ValidationSummary } from "./ValidationSummary";
import { WorkflowActions } from "./WorkflowActions";

type RequestWorkbenchProps = {
  evaluated: EvaluatedUi;
  selectedPage?: UiNode;
  selectedPageId: string | null;
  setSelectedPageId: (id: string) => void;
  actorId: string;
};

export const RequestWorkbench = ({ evaluated, selectedPage, selectedPageId, setSelectedPageId, actorId }: RequestWorkbenchProps) => {
  const [draft, setDraft] = useState(evaluated.requestData);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDraft(evaluated.requestData);
  }, [evaluated.requestData]);

  const save = useMutation({
    mutationFn: () => saveRequestData(evaluated.requestCaseId, actorId, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluated-ui"] }),
  });

  const action = useMutation({
    mutationFn: (actionId: string) => executeRequestAction(evaluated.requestCaseId, actorId, actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluated-ui"] }),
  });

  const visiblePages = evaluated.pages.filter((page) => page.visible);

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
        <ValidationSummary evaluated={evaluated} />
        <WorkflowActions actions={evaluated.workflowActions} runAction={(id) => action.mutate(id)} pending={action.isPending} />
        {action.data ? <ActionMessage result={action.data as { success: boolean; message: string }} /> : null}
        {selectedPage && (
          <div className="panel">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold">{selectedPage.label}</h2>
              <button className="button" onClick={() => save.mutate()} disabled={save.isPending || !evaluated.canSave}>
                Save draft
              </button>
            </div>
            <div className="space-y-4">
              {(selectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={setDraft} actorRole={evaluated.actor.role} runAction={(id) => action.mutate(id)} />
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
