import type { EvaluatedUi } from "../../types/api";

type ValidationSummaryProps = {
  evaluated: EvaluatedUi;
};

export const ValidationSummary = ({ evaluated }: ValidationSummaryProps) => {
  const issues = [...(evaluated.validation.submit ?? []), ...(evaluated.validation.approve ?? [])];
  if (issues.length === 0) {
    return <div className="notice success">No blocking submit or approval validation issues.</div>;
  }
  return (
    <div className="notice warning">
      <div className="mb-2 text-sm font-semibold">Blocking validation summary</div>
      <ul className="space-y-1 text-sm">
        {issues.map((issue) => (
          <li key={`${issue.ruleId}-${issue.message}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
};
