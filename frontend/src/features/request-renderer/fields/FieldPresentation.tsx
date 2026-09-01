import type { UiNode } from "../../../types/api";

export type FieldPresentation = {
  describedBy?: string;
  disabled: boolean;
  helperId: string;
  helperText?: string;
};

export const getFieldPresentation = (node: UiNode): FieldPresentation => {
  const helperId = `${node.id}-helper`;
  const helperText = node.disabled ? "Read-only for the current user and request stage." : node.helperText;
  return {
    describedBy: helperText ? helperId : undefined,
    disabled: node.disabled,
    helperId,
    helperText,
  };
};

export const FieldLabel = ({ id, node }: { id?: string; node: UiNode }) => (
  <span id={id}>{node.label}{node.required ? " *" : ""}</span>
);

export const FieldHelper = ({ presentation }: { presentation: FieldPresentation }) => presentation.helperText
  ? <em id={presentation.helperId}>{presentation.helperText}</em>
  : null;
