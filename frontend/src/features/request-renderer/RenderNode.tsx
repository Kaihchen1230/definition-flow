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
};

export const RenderNode = ({ node, data, setData, userRole, runAction }: RenderNodeProps) => {
  if (node.type === "collection" && node.dataPath === "founders") {
    return <FoundersTable node={node} data={data} setData={setData} />;
  }
  if (node.type === "collection" && node.dataPath === "exceptions") {
    return <ExceptionList node={node} data={data} setData={setData} userRole={userRole} />;
  }
  if (node.type === "calculation") {
    return <ActionPanel node={node} runAction={runAction} />;
  }
  if (node.type === "summary") {
    return <pre className="code-surface">{JSON.stringify(data, null, 2)}</pre>;
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
  return <Field node={node} value={getPath(data, node.dataPath)} onChange={(value) => setData((current) => setPath(current, node.dataPath!, value))} />;
};
