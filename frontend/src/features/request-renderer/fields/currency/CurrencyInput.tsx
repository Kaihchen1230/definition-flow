import { useEffect, useState } from "react";

type CurrencyInputProps = {
  currency: string;
  describedBy?: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: number | "") => void;
  value: unknown;
};

export const CurrencyInput = ({ currency, describedBy, disabled, invalid, onChange, value }: CurrencyInputProps) => {
  const [editing, setEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => formatCurrency(value, currency));

  useEffect(() => {
    if (!editing) {
      setDisplayValue(formatCurrency(value, currency));
    }
  }, [currency, editing, value]);

  const beginEditing = () => {
    setEditing(true);
    setDisplayValue(rawNumericValue(value));
  };

  const updateValue = (input: string) => {
    const sanitized = sanitizeNumericInput(input);
    setDisplayValue(sanitized);
    if (sanitized === "" || sanitized === "-" || sanitized === "." || sanitized === "-.") {
      onChange("");
      return;
    }
    const numericValue = Number(sanitized);
    if (Number.isFinite(numericValue)) {
      onChange(numericValue);
    }
  };

  const finishEditing = () => {
    setEditing(false);
    setDisplayValue(formatCurrency(displayValue, currency));
  };

  return (
    <input
      className={`control currency-control ${invalid ? "is-invalid" : ""}`}
      type="text"
      inputMode="decimal"
      value={displayValue}
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onBlur={finishEditing}
      onChange={(event) => updateValue(event.target.value)}
      onFocus={beginEditing}
    />
  );
};

const formatterFor = (currency: string) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: unknown, currency: string) => {
  const numericValue = typeof value === "number" ? value : Number(sanitizeNumericInput(String(value ?? "")));
  return value === "" || value == null || !Number.isFinite(numericValue) ? "" : formatterFor(currency).format(numericValue);
};

const rawNumericValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? String(value) : sanitizeNumericInput(String(value ?? ""));

const sanitizeNumericInput = (value: string) => {
  const normalized = value.replace(/[^\d.-]/g, "");
  const negative = normalized.startsWith("-") ? "-" : "";
  const unsigned = normalized.replace(/-/g, "");
  const [whole, ...fractions] = unsigned.split(".");
  return `${negative}${whole}${fractions.length > 0 ? `.${fractions.join("")}` : ""}`;
};
