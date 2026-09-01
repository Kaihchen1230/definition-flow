import type { UiNode } from "../../../types/api";

export type FieldControlProps = {
  node: UiNode;
  value: any;
  onChange: (value: any) => void;
  invalid?: boolean;
};
