import type { Dispatch, SetStateAction } from "react";
import { yesNoNa } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";

type FoundersTableProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  missingPaths?: Set<string>;
  validationActive?: boolean;
};

export const FoundersTable = ({ node, data, setData, missingPaths = new Set(), validationActive = false }: FoundersTableProps) => {
  const founders = Array.isArray(data.founders) ? data.founders : [];
  const disabled = node.disabled;
  const update = (index: number, field: string, value: any) => {
    setData((current) => {
      const currentFounders = Array.isArray(current.founders) ? current.founders : [];
      return { ...current, founders: currentFounders.map((founder: any, i: number) => (i === index ? { ...founder, [field]: value } : founder)) };
    });
  };
  const inputClass = (path: string, extra = "") => `control table-control ${extra} ${validationActive && missingPaths.has(path) ? "is-invalid" : ""}`.trim();
  const missing = (index: number, field: string) => validationActive && missingPaths.has(`founders.${index}.${field}`);
  const addFounder = () => {
    setData((current) => ({ ...current, founders: [...(Array.isArray(current.founders) ? current.founders : []), { name: "", title: "", ownershipPercent: "", backgroundCheck: "" }] }));
  };
  const removeFounder = (index: number) => {
    setData((current) => ({ ...current, founders: (Array.isArray(current.founders) ? current.founders : []).filter((_: any, i: number) => i !== index) }));
  };
  return (
    <section className={`subpanel ${validationActive && missingPaths.size > 0 ? "validation-surface" : ""}`}>
      <div className="section-head">
        <div>
          <h3>{node.label}</h3>
          <p>{founders.length} founder record{founders.length === 1 ? "" : "s"} in scope. All table fields are required.</p>
        </div>
        <button className="button secondary" disabled={disabled} onClick={addFounder}>
          Add founder
        </button>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Ownership %</th>
              <th>Background</th>
              <th className="action-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {founders.map((founder: any, index: number) => (
              <tr key={index}>
                <td>
                  <input className={inputClass(`founders.${index}.name`)} aria-invalid={missing(index, "name")} aria-label="Founder name" value={founder.name ?? ""} disabled={disabled} onChange={(event) => update(index, "name", event.target.value)} />
                </td>
                <td>
                  <input className={inputClass(`founders.${index}.title`)} aria-invalid={missing(index, "title")} aria-label="Founder title" value={founder.title ?? ""} disabled={disabled} onChange={(event) => update(index, "title", event.target.value)} />
                </td>
                <td>
                  <input className={inputClass(`founders.${index}.ownershipPercent`, "numeric")} aria-invalid={missing(index, "ownershipPercent")} aria-label="Ownership percent" type="number" value={founder.ownershipPercent ?? ""} disabled={disabled} onChange={(event) => update(index, "ownershipPercent", event.target.value === "" ? "" : Number(event.target.value))} />
                </td>
                <td>
                  <select className={inputClass(`founders.${index}.backgroundCheck`)} aria-invalid={missing(index, "backgroundCheck")} aria-label="Background check" value={founder.backgroundCheck ?? ""} disabled={disabled} onChange={(event) => update(index, "backgroundCheck", event.target.value)}>
                    <option value="">Select</option>
                    {yesNoNa().map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </td>
                <td className="action-column">
                  <button className="icon-button danger" type="button" aria-label={`Remove founder ${index + 1}`} disabled={disabled} onClick={() => removeFounder(index)}>
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
