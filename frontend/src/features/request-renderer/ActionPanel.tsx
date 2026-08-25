import type { UiNode } from "../../types/api";

type ActionPanelProps = {
  node: UiNode;
  runAction: (id: string) => void;
};

export const ActionPanel = ({ node, runAction }: ActionPanelProps) => {
  return (
    <section className="subpanel">
      <div className="section-head">
        <div>
          <h3>{node.label ?? "Approval route"}</h3>
          <p>Refresh route calculation before submitting or approving.</p>
        </div>
      </div>
      {(node.actions ?? []).filter((action) => action.visible).map((action) => (
        <button key={action.id} className="button" disabled={action.disabled} onClick={() => runAction(action.id)}>
          Calculate approval route
        </button>
      ))}
    </section>
  );
};
