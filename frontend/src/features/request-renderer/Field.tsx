import { enumOptions } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";
import { localToday } from "../../utils/fieldValidation";

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
  const helperText = disabled ? "Read-only for the current user and request stage." : node.helperText;
  const helper = helperText ? <em id={helperId}>{helperText}</em> : null;
  const describedBy = helperText ? helperId : undefined;
  if (node.component === "textarea") {
    return (
      <label className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <textarea className={`control min-h-28 ${invalid ? "is-invalid" : ""}`} value={value ?? ""} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} />
        {helper}
      </label>
    );
  }
  if (node.component === "dropdown") {
    return (
      <label className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <select className={`control ${invalid ? "is-invalid" : ""}`} value={value ?? ""} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helper}
      </label>
    );
  }
  if (node.component === "radioGroup") {
    return (
      <div className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <div className="choice-grid compact" aria-describedby={describedBy}>
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input type="radio" checked={value === option.value} disabled={disabled} aria-invalid={invalid} onChange={() => onChange(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
        {helper}
      </div>
    );
  }
  if (node.component === "checkboxGroup") {
    const selected = Array.isArray(value) ? value : [];
    const updateSelection = (optionValue: string, checked: boolean) => {
      const next = new Set(checked ? [...selected, optionValue] : selected.filter((item) => item !== optionValue));
      onChange(options.map((option) => option.value).filter((optionValue) => next.has(optionValue)));
    };
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
                aria-describedby={describedBy}
                onChange={(event) => updateSelection(option.value, event.target.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {helper}
      </div>
    );
  }
  const inputType = node.component === "dateInput" ? "date" : node.component === "currencyInput" ? "number" : "text";
  const max = inputType === "date" && node.constraints?.maxDate
    ? node.constraints.maxDate === "today" ? localToday() : node.constraints.maxDate
    : node.constraints?.max;
  return (
    <label className="field">
      <span>{node.label}{node.required ? " *" : ""}</span>
      <input className={`control ${invalid ? "is-invalid" : ""}`} type={inputType} value={value ?? ""} disabled={disabled} min={node.constraints?.min} max={max} step={node.constraints?.step} aria-invalid={invalid} aria-describedby={describedBy} onChange={(event) => onChange(inputType === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} />
      {helper}
    </label>
  );
};
