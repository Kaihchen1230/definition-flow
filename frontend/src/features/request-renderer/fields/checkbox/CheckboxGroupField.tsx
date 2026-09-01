import { enumOptions } from "../../../../config/enumOptions";
import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";

export const CheckboxGroupField = ({ node, value, onChange }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  const options = enumOptions[node.dataPath ?? ""] ?? [];
  const selected = Array.isArray(value) ? value : [];
  const updateSelection = (optionValue: string, checked: boolean) => {
    const next = new Set(checked ? [...selected, optionValue] : selected.filter((item) => item !== optionValue));
    onChange(options.map((option) => option.value).filter((optionValue) => next.has(optionValue)));
  };
  return (
    <div className="field">
      <FieldLabel node={node} />
      <div className="choice-grid">
        {options.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              disabled={presentation.disabled}
              aria-describedby={presentation.describedBy}
              onChange={(event) => updateSelection(option.value, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldHelper presentation={presentation} />
    </div>
  );
};
