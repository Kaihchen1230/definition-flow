export const uiComponentIds = [
  "textInput",
  "dateInput",
  "currencyInput",
  "textarea",
  "dropdown",
  "radioGroup",
  "checkboxGroup",
  "editableTable",
  "exceptionList",
  "finalReviewSummary",
] as const;

export type UiComponentId = (typeof uiComponentIds)[number];
