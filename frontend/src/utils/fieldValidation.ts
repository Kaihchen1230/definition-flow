import type { FieldConstraints } from "../types/api";

export type FieldValidationContext = {
  today: string;
};

export const localToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const fieldValueIsValid = (value: unknown, constraints: FieldConstraints | undefined, context: FieldValidationContext) => {
  if (!constraints) {
    return true;
  }
  if (constraints.maxDate) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const maxDate = constraints.maxDate === "today" ? context.today : constraints.maxDate;
    if (value > maxDate) {
      return false;
    }
  }
  if (constraints.min != null && (typeof value !== "number" || !Number.isFinite(value) || value < constraints.min)) {
    return false;
  }
  if (constraints.max != null && (typeof value !== "number" || !Number.isFinite(value) || value > constraints.max)) {
    return false;
  }
  if (constraints.allowedValues) {
    if (Array.isArray(value)) {
      return value.every((item) => typeof item === "string" && constraints.allowedValues?.includes(item));
    }
    if (typeof value !== "string" || !constraints.allowedValues.includes(value)) {
      return false;
    }
  }
  return true;
};
