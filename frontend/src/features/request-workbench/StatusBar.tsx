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
    <div className="status-strip">
      <Stat label="Workflow" value={formatStatusValue(evaluated.workflowState)} />
      <Stat label="User" value={`${evaluated.user.displayName}`} />
      <Stat label="Variant" value={formatStatusValue(String(evaluated.derived.investmentVariant ?? "N/A"))} />
      <Stat label="Approval Route" value={routeStatus(evaluated.calculations.approvalRoute)} />
    </div>
  );
};

const Stat = ({ label, value }: StatProps) => {
  return (
    <div className="status-cell">
      <div className="status-label">{label}</div>
      <div className="status-value">{value}</div>
    </div>
  );
};

const routeStatus = (route: any) => {
  if (!route?.exists) return "Not calculated";
  if (route.stale) return "Stale";
  return route.result?.requiredLevels?.map(formatStatusValue).join(", ") ?? "Fresh";
};

const formatStatusValue = (value: string) => {
  if (value === "N/A") {
    return value;
  }
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};
