import type { EvaluatedUi } from "../../types/api";

type StatusBarProps = {
  evaluated: EvaluatedUi;
};

type StatProps = {
  label: string;
  value: string;
};

export const StatusBar = ({ evaluated }: StatusBarProps) => {
  return (
    <div className="panel grid grid-cols-4 gap-3 text-sm">
      <Stat label="Workflow" value={evaluated.workflowState} />
      <Stat label="Actor" value={`${evaluated.actor.displayName}`} />
      <Stat label="Variant" value={String(evaluated.derived.investmentVariant ?? "N/A")} />
      <Stat label="Approval Route" value={routeStatus(evaluated.calculations.approvalRoute)} />
    </div>
  );
};

const Stat = ({ label, value }: StatProps) => {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
};

const routeStatus = (route: any) => {
  if (!route?.exists) return "Not calculated";
  if (route.stale) return "Stale";
  return route.result?.requiredLevels?.join(", ") ?? "Fresh";
};
