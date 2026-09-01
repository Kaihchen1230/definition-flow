import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";
import { CurrencyInput } from "./CurrencyInput";

export const CurrencyField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  return (
    <label className="field">
      <FieldLabel node={node} />
      <CurrencyInput
        currency={node.constraints?.currency ?? "USD"}
        value={value}
        disabled={presentation.disabled}
        invalid={invalid}
        describedBy={presentation.describedBy}
        onChange={onChange}
      />
      <FieldHelper presentation={presentation} />
    </label>
  );
};
