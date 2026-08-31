import type { DropdownControlProps } from "./types";

export const NativeDropdown = ({ id, labelId, value, options, disabled, invalid, describedBy, onChange }: DropdownControlProps) => (
  <select
    id={id}
    className={`control ${invalid ? "is-invalid" : ""}`}
    value={value}
    disabled={disabled}
    aria-labelledby={labelId}
    aria-invalid={invalid}
    aria-describedby={describedBy}
    onChange={(event) => onChange(event.target.value)}
  >
    <option value="">Select</option>
    {options.map((option) => (
      <option value={option.value} key={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
