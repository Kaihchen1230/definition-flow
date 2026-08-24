import type { WorkflowAction } from "../../types/api";

type WorkflowActionsProps = {
  actions: WorkflowAction[];
  runAction: (id: string) => void;
  pending: boolean;
};

export const WorkflowActions = ({ actions, runAction, pending }: WorkflowActionsProps) => {
  const available = actions.filter((action) => action.visible);
  if (available.length === 0) {
    return null;
  }
  return (
    <div className="panel flex flex-wrap gap-2">
      {available.map((action) => (
        <button
          className={action.id.includes("decline") || action.id.includes("withdraw") ? "button secondary" : "button"}
          key={action.id}
          onClick={() => runAction(action.id)}
          disabled={pending || action.disabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
