import { enumOptions } from "../../../../config/enumOptions";
import { FieldHelper, FieldLabel, getFieldPresentation } from "../FieldPresentation";
import type { FieldControlProps } from "../types";
import { DropdownControl } from "./DropdownControl";

export const DropdownField = ({ node, value, onChange, invalid = false }: FieldControlProps) => {
  const presentation = getFieldPresentation(node);
  const labelId = `${node.id}-label`;
  return (
    <div className="field">
      <FieldLabel id={labelId} node={node} />
      <DropdownControl
        id={node.id}
        labelId={labelId}
        value={value ?? ""}
        options={enumOptions[node.dataPath ?? ""] ?? []}
        disabled={presentation.disabled}
        invalid={invalid}
        describedBy={presentation.describedBy}
        onChange={onChange}
      />
      <FieldHelper presentation={presentation} />
    </div>
  );
};
