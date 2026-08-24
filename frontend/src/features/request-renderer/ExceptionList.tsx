import type { Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";

type ExceptionListProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  actorRole: string;
};

export const ExceptionList = ({ node, data, setData, actorRole }: ExceptionListProps) => {
  const exceptions = Array.isArray(data.exceptions) ? data.exceptions : [];
  const visible = exceptions.filter((item: any) => item.createdBy?.role === node.filter?.value);
  const disabled = node.disabled;
  const update = (id: string, patch: Record<string, any>) => {
    setData((current) => ({
      ...current,
      exceptions: exceptions.map((item: any) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };
  const addException = () => {
    const role = actorRole === "RiskOfficer" ? "RiskOfficer" : "InvestmentAnalyst";
    setData((current) => ({
      ...current,
      exceptions: [
        ...exceptions,
        { id: `ex-${Date.now()}`, description: "", severity: "MEDIUM", createdBy: { userId: role, role }, riskConfirmation: "" },
      ],
    }));
  };
  return (
    <section className="subpanel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{node.label}</h3>
        {(node.actions ?? []).filter((action) => action.visible).map((action) => (
          <button key={action.id} className="button secondary" disabled={action.disabled} onClick={addException}>Add exception</button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((item: any) => (
          <div className="rounded border border-slate-200 p-3" key={item.id}>
            <textarea className="control min-h-16" value={item.description ?? ""} disabled={disabled} onChange={(event) => update(item.id, { description: event.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <select className="control w-40" value={item.severity ?? "MEDIUM"} disabled={disabled} onChange={(event) => update(item.id, { severity: event.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              {item.createdBy?.role === "InvestmentAnalyst" && actorRole === "RiskOfficer" && (
                <select className="control w-52" value={item.riskConfirmation ?? ""} disabled={disabled} onChange={(event) => update(item.id, { riskConfirmation: event.target.value })}>
                  <option value="">Risk confirmation...</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REFER_BACK">Refer back</option>
                </select>
              )}
              <span className="text-xs text-slate-500">Created by {item.createdBy?.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
