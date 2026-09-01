import type { ComponentType } from "react";
import type { UiComponentId } from "../../types/uiComponents";
import { ExceptionList } from "./ExceptionList";
import { CheckboxGroupField } from "./fields/checkbox/CheckboxGroupField";
import { configuredField } from "./fields/configuredField";
import { CurrencyField } from "./fields/currency/CurrencyField";
import { DateInputField } from "./fields/date/DateInputField";
import { DropdownField } from "./fields/dropdown/DropdownField";
import { RadioGroupField } from "./fields/radio/RadioGroupField";
import { TextInputField } from "./fields/text/TextInputField";
import { TextareaField } from "./fields/textarea/TextareaField";
import { FoundersTable } from "./FoundersTable";
import type { ConfiguredComponentProps } from "./types";

const Founders = ({ node, data, setData, missingPaths, validationActive }: ConfiguredComponentProps) => (
  <FoundersTable node={node} data={data} setData={setData} missingPaths={missingPaths} validationActive={validationActive} />
);

const Exceptions = ({ node, data, setData, userId, userRole, missingPaths, validationActive }: ConfiguredComponentProps) => (
  <ExceptionList node={node} data={data} setData={setData} userId={userId} userRole={userRole} missingPaths={missingPaths} validationActive={validationActive} />
);

const FinalReviewSummary = ({ data, userRole }: ConfiguredComponentProps) => (
  <pre className="code-surface">{JSON.stringify(summaryDataForRole(data, userRole), null, 2)}</pre>
);

export const componentRegistry = {
  textInput: configuredField(TextInputField),
  dateInput: configuredField(DateInputField),
  currencyInput: configuredField(CurrencyField),
  textarea: configuredField(TextareaField),
  dropdown: configuredField(DropdownField),
  radioGroup: configuredField(RadioGroupField),
  checkboxGroup: configuredField(CheckboxGroupField),
  editableTable: Founders,
  exceptionList: Exceptions,
  finalReviewSummary: FinalReviewSummary,
} satisfies Record<UiComponentId, ComponentType<ConfiguredComponentProps>>;

const summaryDataForRole = (data: Record<string, any>, userRole: string) => {
  if (userRole !== "InvestmentAnalyst") {
    return data;
  }
  const { risk: _risk, ...investmentData } = data;
  return {
    ...investmentData,
    exceptions: Array.isArray(data.exceptions)
      ? data.exceptions.filter((item: any) => item.createdBy?.role === "InvestmentAnalyst")
      : [],
  };
};
