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
      <Stat label="Request stage" value={formatStatusValue(evaluated.workflowState)} />
      <Stat label="Acting as" value={`${evaluated.user.displayName}`} />
      <Stat label="Required investment levels" value={approvalLevels(evaluated.requestData.approvalRequirements?.investmentLevels)} />
      <Stat label="Required risk levels" value={approvalLevels(evaluated.requestData.approvalRequirements?.riskLevels)} />
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

const approvalLevels = (value: unknown) => Array.isArray(value) && value.length > 0
  ? [...value].sort().map((level) => formatStatusValue(String(level))).join(" → ")
  : "Not selected";

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
