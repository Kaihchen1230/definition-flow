import { localToday } from "../../../../utils/fieldValidation";
import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";

export const DateInputField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  const configuredMax = node.constraints?.maxDate;
  const max = configuredMax === "today" ? localToday() : configuredMax;
  return (
    <label className="field">
      <FieldLabel node={node} />
      <input
        className={`control ${invalid ? "is-invalid" : ""}`}
        type="date"
        value={value ?? ""}
        disabled={presentation.disabled}
        min={node.constraints?.min}
        max={max}
        step={node.constraints?.step}
        aria-invalid={invalid}
        aria-describedby={presentation.describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldHelper presentation={presentation} />
    </label>
  );
};
