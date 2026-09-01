import { enumOptions } from "../../config/enumOptions";
import type { UiNode } from "../../types/api";
import { localToday } from "../../utils/fieldValidation";
import { CurrencyInput } from "./fields/currency/CurrencyInput";
import { DropdownControl } from "./fields/dropdown/DropdownControl";

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
    const labelId = `${node.id}-label`;
    return (
      <div className="field">
        <span id={labelId}>{node.label}{node.required ? " *" : ""}</span>
        <DropdownControl
          id={node.id}
          labelId={labelId}
          value={value ?? ""}
          options={options}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
          onChange={onChange}
        />
        {helper}
      </div>
    );
  }
  if (node.component === "radioGroup") {
    return (
      <div className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <div className="choice-grid compact" aria-describedby={describedBy}>
          {options.map((option) => {
            const tooltipId = `${node.id}-${option.value}-description`;
            return (
              <div className="choice-with-help" key={option.value}>
                <label className={`choice ${option.description ? "with-help" : ""}`}>
                  <input type="radio" checked={value === option.value} disabled={disabled} aria-invalid={invalid} onChange={() => onChange(option.value)} />
                  {option.label}
                </label>
                {option.description ? (
                  <>
                    <button className="choice-help" type="button" aria-label={`About ${option.label}`} aria-describedby={tooltipId}>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <circle cx="8" cy="8" r="6" />
                        <path d="M8 7.1v4" />
                        <path d="M8 4.7h.01" />
                      </svg>
                    </button>
                    <span className="choice-tooltip" id={tooltipId} role="tooltip">{option.description}</span>
                  </>
                ) : null}
              </div>
            );
          })}
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
  if (node.component === "currencyInput") {
    return (
      <label className="field">
        <span>{node.label}{node.required ? " *" : ""}</span>
        <CurrencyInput
          currency={node.constraints?.currency ?? "USD"}
          value={value}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
          onChange={onChange}
        />
        {helper}
      </label>
    );
  }
  const inputType = node.component === "dateInput" ? "date" : "text";
  const max = inputType === "date" && node.constraints?.maxDate
    ? node.constraints.maxDate === "today" ? localToday() : node.constraints.maxDate
    : node.constraints?.max;
  return (
    <label className="field">
      <span>{node.label}{node.required ? " *" : ""}</span>
      <input className={`control ${invalid ? "is-invalid" : ""}`} type={inputType} value={value ?? ""} disabled={disabled} min={node.constraints?.min} max={max} step={node.constraints?.step} aria-invalid={invalid} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} />
      {helper}
    </label>
  );
};
