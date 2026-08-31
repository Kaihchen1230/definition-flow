import type { EnumOption } from "../../../../config/enumOptions";

export type DropdownControlProps = {
  id: string;
  labelId: string;
  value: string;
  options: EnumOption[];
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
};
