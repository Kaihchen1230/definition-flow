import type { ComponentType, Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";
import type { UiComponentId } from "../../types/uiComponents";
import { getPath, setPath } from "../../utils/objectPath";
import { ExceptionList } from "./ExceptionList";
import { Field } from "./Field";
import { FoundersTable } from "./FoundersTable";

export type ConfiguredComponentProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  userId: string;
  userRole: string;
  runAction: (id: string) => void;
  missingPaths?: Set<string>;
  validationActive?: boolean;
};

const ScalarField = ({ node, data, setData, missingPaths, validationActive }: ConfiguredComponentProps) => (
  <Field
    node={node}
    value={node.dataPath ? getPath(data, node.dataPath) : undefined}
    onChange={(value) => node.dataPath && setData((current) => setPath(current, node.dataPath!, value))}
    invalid={Boolean(validationActive && node.dataPath && missingPaths?.has(node.dataPath))}
  />
);

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
  textInput: ScalarField,
  dateInput: ScalarField,
  currencyInput: ScalarField,
  textarea: ScalarField,
  dropdown: ScalarField,
  radioGroup: ScalarField,
  checkboxGroup: ScalarField,
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
