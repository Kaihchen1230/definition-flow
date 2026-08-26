import { enumOptions } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";

type FieldProps = {
  node: UiNode;
  value: any;
  onChange: (value: any) => void;
  invalid?: boolean;
};

export const Field = ({ node, value, onChange, invalid = false }: FieldProps) => {
  const disabled = node.disabled;
  const options = enumOptions[node.dataPath ?? ""] ?? [];
  const helperId = `${node.id}-helper`;
  if (node.component === "textarea") {
    return (
      <label className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <textarea className={`control min-h-28 ${invalid ? "is-invalid" : ""}`} value={value ?? ""} disabled={disabled} aria-invalid={invalid} aria-describedby={helperId} onChange={(event) => onChange(event.target.value)} />
        <em id={helperId}>Saved with this page only.</em>
      </label>
    );
  }
  if (node.component === "dropdown") {
    return (
      <label className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <select className={`control ${invalid ? "is-invalid" : ""}`} value={value ?? ""} disabled={disabled} aria-invalid={invalid} aria-describedby={helperId} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <em id={helperId}>{disabled ? "Read-only for this role and workflow state." : "Choose the current request value."}</em>
      </label>
    );
  }
  if (node.component === "radioGroup") {
    return (
      <div className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <div className="choice-grid compact">
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input type="radio" checked={value === option.value} disabled={disabled} aria-invalid={invalid} onChange={() => onChange(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (node.component === "checkboxGroup") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <div className="choice-grid">
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value))}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    );
  }
  const inputType = node.component === "dateInput" ? "date" : node.component === "currencyInput" ? "number" : "text";
  return (
    <label className="field">
      <span>{node.label}{node.required ? " *" : ""}</span>
      <input className={`control ${invalid ? "is-invalid" : ""}`} type={inputType} value={value ?? ""} disabled={disabled} aria-invalid={invalid} aria-describedby={helperId} onChange={(event) => onChange(inputType === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} />
      <em id={helperId}>{disabled ? "Read-only for this role and workflow state." : "Editable request data."}</em>
    </label>
  );
};
