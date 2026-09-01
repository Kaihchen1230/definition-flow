import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";

export const TextInputField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  return (
    <label className="field">
      <FieldLabel node={node} />
      <input
        className={`control ${invalid ? "is-invalid" : ""}`}
        type="text"
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
