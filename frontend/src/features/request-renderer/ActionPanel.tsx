import type { UiNode } from "../../types/api";

type ActionPanelProps = {
  node: UiNode;
  runAction: (id: string) => void;
};

export const ActionPanel = ({ node, runAction }: ActionPanelProps) => {
  return (
    <section className="subpanel">
      <h3 className="mb-3 font-medium">{node.label}</h3>
      {(node.actions ?? []).filter((action) => action.visible).map((action) => (
        <button key={action.id} className="button" disabled={action.disabled} onClick={() => runAction(action.id)}>
          Calculate approval route
        </button>
      ))}
    </section>
  );
};
