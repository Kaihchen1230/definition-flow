import type { Dispatch, SetStateAction } from "react";
import { yesNoNa } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";

type FoundersTableProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
};

export const FoundersTable = ({ node, data, setData }: FoundersTableProps) => {
  const founders = Array.isArray(data.founders) ? data.founders : [];
  const disabled = node.disabled;
  const update = (index: number, field: string, value: any) => {
    setData((current) => ({ ...current, founders: founders.map((founder: any, i: number) => (i === index ? { ...founder, [field]: value } : founder)) }));
  };
  return (
    <section className="subpanel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{node.label}</h3>
        <button className="button secondary" disabled={disabled} onClick={() => setData((current) => ({ ...current, founders: [...founders, { name: "", title: "", ownershipPercent: 0, backgroundCheck: "NA" }] }))}>
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
            </tr>
          </thead>
          <tbody>
            {founders.map((founder: any, index: number) => (
              <tr key={index}>
                <td><input className="control" value={founder.name ?? ""} disabled={disabled} onChange={(event) => update(index, "name", event.target.value)} /></td>
                <td><input className="control" value={founder.title ?? ""} disabled={disabled} onChange={(event) => update(index, "title", event.target.value)} /></td>
                <td><input className="control" type="number" value={founder.ownershipPercent ?? 0} disabled={disabled} onChange={(event) => update(index, "ownershipPercent", Number(event.target.value))} /></td>
                <td>
                  <select className="control" value={founder.backgroundCheck ?? "NA"} disabled={disabled} onChange={(event) => update(index, "backgroundCheck", event.target.value)}>
                    {yesNoNa().map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
