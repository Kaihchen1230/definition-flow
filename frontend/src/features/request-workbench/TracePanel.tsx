import type { UiNode } from "../../types/api";

type TracePanelProps = {
  pages: UiNode[];
};

type TraceNodeProps = {
  node: UiNode;
};

export const TracePanel = ({ pages }: TracePanelProps) => {
  return (
    <div className="panel max-h-[calc(100vh-130px)] overflow-auto">
      <h2 className="mb-3 text-base font-semibold">Rule Trace</h2>
      <div className="space-y-3">
        {pages.map((page) => (
          <TraceNode node={page} key={page.id} />
        ))}
      </div>
    </div>
  );
};

const TraceNode = ({ node }: TraceNodeProps) => {
  return (
    <details className="rounded border border-slate-200 p-2 text-xs" open={node.visible === false}>
      <summary className="cursor-pointer font-medium">
        {node.label ?? node.id} <span className={node.visible ? "text-emerald-700" : "text-red-700"}>{node.visible ? "visible" : "hidden"}</span>
      </summary>
      <pre className="mt-2 overflow-auto rounded bg-slate-950 p-2 text-slate-100">{JSON.stringify(node.debug, null, 2)}</pre>
      {(node.children ?? []).map((child) => <TraceNode node={child} key={child.id} />)}
    </details>
  );
};
