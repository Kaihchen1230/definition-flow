import type { UiNode } from "../../types/api";

type ActionPanelProps = {
  node: UiNode;
  runAction: (id: string) => void;
};

export const ActionPanel = ({ node, runAction }: ActionPanelProps) => {
  const route = node.value as {
    exists?: boolean;
    stale?: boolean;
    result?: { routeType?: string; routingReason?: string; requiredLevels?: string[] };
  } | undefined;
  return (
    <section className="subpanel">
      <div className="section-head">
        <div>
          <h3>{node.label ?? "Approval route"}</h3>
          <p>Every request follows Investment Approver → Risk Officer → Risk Approver. High-risk conditions activate enhanced risk requirements.</p>
        </div>
      </div>
      <div className="notice">
        <strong>Routing logic:</strong> All requests complete the full approval chain. Enhanced risk review is activated when amount is at least $5M, stage is Seed or Pre-revenue, or the request has a material exception.
        {route?.exists ? (
          <div className="mt-2">
            <strong>Current decision:</strong> {route.result?.routingReason} Route: {formatRoute(route.result?.routeType)}
            {route.stale ? " (stale—recalculate before continuing)" : ""}
          </div>
        ) : null}
      </div>
      {(node.actions ?? []).filter((action) => action.visible).map((action) => (
        <button key={action.id} className="button" disabled={action.disabled} onClick={() => runAction(action.id)}>
          Calculate approval route
        </button>
      ))}
    </section>
  );
};

const formatRoute = (routeType?: string) => {
  if (routeType === "ENHANCED_RISK_CHAIN") return "Full chain with enhanced risk review";
  if (routeType === "STANDARD_APPROVAL_CHAIN") return "Standard full approval chain";
  return "Not calculated";
};
