import type { Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";

type ExceptionListProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  userRole: string;
};

export const ExceptionList = ({ node, data, setData, userRole }: ExceptionListProps) => {
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
    const role = userRole === "RiskOfficer" ? "RiskOfficer" : "InvestmentAnalyst";
    setData((current) => ({
      ...current,
      exceptions: [
        ...exceptions,
        { id: `ex-${Date.now()}`, description: "", severity: "MEDIUM", createdBy: { userId: role, role }, riskConfirmation: "" },
      ],
    }));
  };
  const canAdd = (node.actions ?? []).some((action) => action.visible && !action.disabled);
  const removeException = (id: string) => {
    setData((current) => ({
      ...current,
      exceptions: (Array.isArray(current.exceptions) ? current.exceptions : []).filter((item: any) => item.id !== id),
    }));
  };
  return (
    <section className="subpanel">
      <div className="section-head">
        <div>
          <h3>{node.label}</h3>
          <p>{visible.length} visible exception{visible.length === 1 ? "" : "s"} for this role</p>
        </div>
        {(node.actions ?? []).filter((action) => action.visible).map((action) => (
          <button key={action.id} className="button secondary" disabled={action.disabled} onClick={addException}>Add exception</button>
        ))}
      </div>
      <div className="exception-stack">
        {visible.map((item: any) => (
          <div className="exception-item" key={item.id}>
            <div className="exception-item-toolbar">
              <span className="meta-chip">Created by {item.createdBy?.role}</span>
              {canAdd && (
                <button className="icon-button danger" type="button" aria-label="Remove exception" disabled={disabled} onClick={() => removeException(item.id)}>
                  <TrashIcon />
                </button>
              )}
            </div>
            <textarea className="control min-h-20" aria-label="Exception description" value={item.description ?? ""} disabled={disabled} onChange={(event) => update(item.id, { description: event.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <select className="control w-40" aria-label="Exception severity" value={item.severity ?? "MEDIUM"} disabled={disabled} onChange={(event) => update(item.id, { severity: event.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              {item.createdBy?.role === "InvestmentAnalyst" && userRole === "RiskOfficer" && (
                <select className="control w-52" aria-label="Risk confirmation" value={item.riskConfirmation ?? ""} disabled={disabled} onChange={(event) => update(item.id, { riskConfirmation: event.target.value })}>
                  <option value="">Risk confirmation</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REFER_BACK">Refer back</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 4.5h9" />
    <path d="M6.5 4.5V3.3h3v1.2" />
    <path d="m5 6 .35 6.6h5.3L11 6" />
    <path d="M7 7.2v4" />
    <path d="M9 7.2v4" />
  </svg>
);
