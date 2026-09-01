import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";

export const TextareaField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  return (
    <label className="field">
      <FieldLabel node={node} />
      <textarea
        className={`control min-h-28 ${invalid ? "is-invalid" : ""}`}
        value={value ?? ""}
        disabled={presentation.disabled}
        aria-invalid={invalid}
        aria-describedby={presentation.describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldHelper presentation={presentation} />
    </label>
  );
};
