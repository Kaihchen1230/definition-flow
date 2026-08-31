import type { Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";
import { componentRegistry } from "./componentRegistry";

type RenderNodeProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  userId: string;
  userRole: string;
  runAction: (id: string) => void;
  missingPaths?: Set<string>;
  validationActive?: boolean;
};

export const RenderNode = ({ node, data, setData, userId, userRole, runAction, missingPaths, validationActive }: RenderNodeProps) => {
  if (node.type === "section") {
    const visibleChildren = (node.children ?? []).filter((child) => child.visible);
    return (
      <section className="subpanel">
        <div className="section-head">
          <h3>{node.label}</h3>
        </div>
        <div className="content-stack">
          {visibleChildren.map((child) => (
            <RenderNode key={child.id} node={child} data={data} setData={setData} userId={userId} userRole={userRole} runAction={runAction} missingPaths={missingPaths} validationActive={validationActive} />
          ))}
        </div>
      </section>
    );
  }
  if (node.type === "action") {
    return (
      <button className="button" disabled={node.disabled} onClick={() => node.actionType && runAction(node.actionType)}>
        {node.label}
      </button>
    );
  }
  if (!node.component) {
    return null;
  }
  const ConfiguredComponent = componentRegistry[node.component];
  return (
    <ConfiguredComponent
      node={node}
      data={data}
      setData={setData}
      userId={userId}
      userRole={userRole}
      runAction={runAction}
      missingPaths={missingPaths}
      validationActive={validationActive}
    />
  );
};
