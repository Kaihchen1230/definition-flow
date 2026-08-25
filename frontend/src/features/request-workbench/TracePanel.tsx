import type { UiNode } from "../../types/api";

type TracePanelProps = {
  pages: UiNode[];
};

type TraceNodeProps = {
  node: UiNode;
};

export const TracePanel = ({ pages }: TracePanelProps) => {
  const hiddenCount = countHiddenNodes(pages);
  return (
    <div className="panel trace-panel">
      <div className="trace-header">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">Evaluation trace</p>
          <h2>Rule Decisions</h2>
        </div>
        <span>{hiddenCount} hidden</span>
      </div>
      <div className="trace-stack">
        {pages.map((page) => (
          <TraceNode node={page} key={page.id} />
        ))}
      </div>
    </div>
  );
};

const TraceNode = ({ node }: TraceNodeProps) => {
  return (
    <details className="trace-node" open={node.visible === false}>
      <summary>
        <span className="truncate">{node.label ?? node.id}</span>
        <span className={node.visible ? "trace-state visible" : "trace-state hidden"}>{node.visible ? "visible" : "hidden"}</span>
      </summary>
      <pre>{JSON.stringify(node.debug, null, 2)}</pre>
      {(node.children ?? []).map((child) => <TraceNode node={child} key={child.id} />)}
    </details>
  );
};

const countHiddenNodes = (nodes: UiNode[]): number => {
  return nodes.reduce((count, node) => {
    const children = node.children ? countHiddenNodes(node.children) : 0;
    return count + (node.visible ? 0 : 1) + children;
  }, 0);
};
