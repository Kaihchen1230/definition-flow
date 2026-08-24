import type { EvaluatedUi } from "../../types/api";

type ValidationSummaryProps = {
  evaluated: EvaluatedUi;
};

export const ValidationSummary = ({ evaluated }: ValidationSummaryProps) => {
  const issues = [...(evaluated.validation.submit ?? []), ...(evaluated.validation.approve ?? [])];
  if (issues.length === 0) {
    return <div className="panel border-emerald-200 bg-emerald-50 text-sm text-emerald-800">No blocking submit/approve validation issues.</div>;
  }
  return (
    <div className="panel border-amber-200 bg-amber-50">
      <div className="mb-2 text-sm font-semibold text-amber-900">Blocking validation summary</div>
      <ul className="space-y-1 text-sm text-amber-900">
        {issues.map((issue) => (
          <li key={`${issue.ruleId}-${issue.message}`}>- {issue.message}</li>
        ))}
      </ul>
    </div>
  );
};
