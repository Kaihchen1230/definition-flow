import type { Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";
import { getPath, setPath } from "../../utils/objectPath";
import { ActionPanel } from "./ActionPanel";
import { ExceptionList } from "./ExceptionList";
import { Field } from "./Field";
import { FoundersTable } from "./FoundersTable";

type RenderNodeProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  userRole: string;
  runAction: (id: string) => void;
  missingPaths?: Set<string>;
  validationActive?: boolean;
};

export const RenderNode = ({ node, data, setData, userRole, runAction, missingPaths, validationActive }: RenderNodeProps) => {
  if (node.type === "section") {
    const visibleChildren = (node.children ?? []).filter((child) => child.visible);
    return (
      <section className="subpanel">
        <div className="section-head">
          <h3>{node.label}</h3>
        </div>
        <div className="content-stack">
          {visibleChildren.map((child) => (
            <RenderNode key={child.id} node={child} data={data} setData={setData} userRole={userRole} runAction={runAction} missingPaths={missingPaths} validationActive={validationActive} />
          ))}
        </div>
      </section>
    );
  }
  if (node.type === "collection" && node.dataPath === "founders") {
    return <FoundersTable node={node} data={data} setData={setData} missingPaths={missingPaths} validationActive={validationActive} />;
  }
  if (node.type === "collection" && node.dataPath === "exceptions") {
    return <ExceptionList node={node} data={data} setData={setData} userRole={userRole} />;
  }
  if (node.type === "calculation") {
    return <ActionPanel node={node} runAction={runAction} />;
  }
  if (node.type === "summary") {
    return <pre className="code-surface">{JSON.stringify(summaryDataForRole(data, userRole), null, 2)}</pre>;
  }
  if (node.type === "action") {
    return (
      <button className="button" disabled={node.disabled} onClick={() => node.actionType && runAction(node.actionType)}>
        {node.label}
      </button>
    );
  }
  if (node.type !== "field" || !node.dataPath) {
    return null;
  }
  return (
    <Field
      node={node}
      value={getPath(data, node.dataPath)}
      onChange={(value) => setData((current) => setPath(current, node.dataPath!, value))}
      invalid={validationActive && missingPaths?.has(node.dataPath)}
    />
  );
};

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
