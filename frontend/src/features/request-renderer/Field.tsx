import { enumOptions } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";

type FieldProps = {
  node: UiNode;
  value: any;
  onChange: (value: any) => void;
};

export const Field = ({ node, value, onChange }: FieldProps) => {
  const disabled = node.disabled;
  const options = enumOptions[node.dataPath ?? ""] ?? [];
  if (node.component === "textarea") {
    return (
      <label className="field">
        <span>{node.label}</span>
        <textarea className="control min-h-24" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (node.component === "dropdown") {
    return (
      <label className="field">
        <span>{node.label}</span>
        <select className="control" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select...</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (node.component === "radioGroup") {
    return (
      <div className="field">
        <span>{node.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input type="radio" checked={value === option.value} disabled={disabled} onChange={() => onChange(option.value)} />
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
        <span>{node.label}</span>
        <div className="grid grid-cols-2 gap-2">
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
      <span>{node.label}</span>
      <input className="control" type={inputType} value={value ?? ""} disabled={disabled} onChange={(event) => onChange(inputType === "number" ? Number(event.target.value) : event.target.value)} />
    </label>
  );
};
