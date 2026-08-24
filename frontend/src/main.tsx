import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./styles.css";

const queryClient = new QueryClient();
const demoRequestId = "11111111-1111-1111-1111-111111111111";

type Actor = {
  id: string;
  displayName: string;
  role: string;
};

type UiNode = {
  id: string;
  type: string;
  component?: string;
  label?: string;
  dataPath?: string;
  value?: unknown;
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  visibleRule?: string;
  enabledRule?: string;
  filter?: { path: string; op: string; value: string };
  debug?: Record<string, unknown>;
  children?: UiNode[];
  actions?: UiNode[];
  actionType?: string;
};

type ValidationIssue = {
  ruleId: string;
  severity: string;
  message: string;
  path: string;
  pageId?: string;
};

type WorkflowAction = {
  id: string;
  label: string;
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  debug?: Record<string, unknown>;
};

type EvaluatedUi = {
  requestCaseId: string;
  requestType: string;
  workflowState: string;
  actor: { userId: string; displayName: string; role: string; entitlements: string[] };
  requestData: Record<string, any>;
  derived: Record<string, unknown>;
  calculations: Record<string, any>;
  definitionVersions: Record<string, number>;
  canSave: boolean;
  pages: UiNode[];
  workflowActions: WorkflowAction[];
  validation: {
    submit: ValidationIssue[];
    approve: ValidationIssue[];
    render: ValidationIssue[];
  };
};

const enumOptions: Record<string, { value: string; label: string }[]> = {
  "company.stage": [
    { value: "SEED", label: "Seed" },
    { value: "PRE_REVENUE", label: "Pre-revenue" },
    { value: "GROWTH", label: "Growth" },
    { value: "LATE_STAGE", label: "Late stage" },
  ],
  "company.sector": [
    { value: "AI", label: "AI" },
    { value: "FINTECH", label: "FinTech" },
    { value: "HEALTHCARE", label: "Healthcare" },
    { value: "INFRASTRUCTURE", label: "Infrastructure" },
    { value: "OTHER", label: "Other" },
  ],
  "company.incorporated": yesNoNa(),
  "investment.instrument": [
    { value: "SAFE", label: "SAFE" },
    { value: "EQUITY", label: "Equity" },
    { value: "CONVERTIBLE_NOTE", label: "Convertible note" },
  ],
  "risk.recommendation": [
    { value: "APPROVE", label: "Approve" },
    { value: "DECLINE", label: "Decline" },
    { value: "REFER_BACK", label: "Refer back" },
  ],
  indicators: [
    { value: "HIGH_BURN_RATE", label: "High burn rate" },
    { value: "PENDING_LITIGATION", label: "Pending litigation" },
    { value: "RELATED_PARTY_TRANSACTION", label: "Related-party transaction" },
    { value: "FOREIGN_OWNERSHIP", label: "Foreign ownership" },
    { value: "DATA_PRIVACY_EXPOSURE", label: "Data privacy exposure" },
  ],
};

function yesNoNa() {
  return [
    { value: "YES", label: "Yes" },
    { value: "NO", label: "No" },
    { value: "NA", label: "N/A" },
  ];
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function App() {
  const queryClient = useQueryClient();
  const [actorId, setActorId] = useState("analyst");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const actors = useQuery({
    queryKey: ["actors"],
    queryFn: () => api<Actor[]>("/api/dev/demo/actors"),
  });

  const evaluated = useQuery({
    queryKey: ["evaluated-ui", actorId],
    queryFn: () => api<EvaluatedUi>(`/api/request-cases/${demoRequestId}/evaluated-ui?actorId=${actorId}`),
  });

  const reset = useMutation({
    mutationFn: () => api("/api/dev/demo/reset", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const reloadDefinitions = useMutation({
    mutationFn: () => api("/api/dev/definitions/reload/startup-investment", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const visiblePages = useMemo(() => evaluated.data?.pages.filter((page) => page.visible) ?? [], [evaluated.data]);

  useEffect(() => {
    if (!selectedPageId && visiblePages.length > 0) {
      setSelectedPageId(visiblePages[0].id);
    }
    if (selectedPageId && visiblePages.length > 0 && !visiblePages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(visiblePages[0].id);
    }
  }, [selectedPageId, visiblePages]);

  const selectedPage = visiblePages.find((page) => page.id === selectedPageId) ?? visiblePages[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">Startup Investment Approval</h1>
            <p className="mt-1 text-sm text-slate-600">
              Definition-driven approval request POC. Backend evaluates rules; React renders the evaluated contract.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="control w-64" value={actorId} onChange={(event) => setActorId(event.target.value)}>
              {(actors.data ?? []).map((actor) => (
                <option value={actor.id} key={actor.id}>
                  {actor.displayName} ({actor.role})
                </option>
              ))}
            </select>
            <button className="button secondary" onClick={() => reloadDefinitions.mutate()}>
              Reload definitions
            </button>
            <button className="button secondary" onClick={() => reset.mutate()}>
              Reset demo
            </button>
          </div>
        </header>

        {evaluated.isLoading && <div className="panel">Loading evaluated UI...</div>}
        {evaluated.error && <div className="panel border-red-300 text-red-700">Backend not ready. Start backend, load definitions, then reset demo data.</div>}

        {evaluated.data && (
          <Workbench
            evaluated={evaluated.data}
            selectedPage={selectedPage}
            selectedPageId={selectedPageId}
            setSelectedPageId={setSelectedPageId}
            actorId={actorId}
          />
        )}
      </div>
    </main>
  );
}

function Workbench({
  evaluated,
  selectedPage,
  selectedPageId,
  setSelectedPageId,
  actorId,
}: {
  evaluated: EvaluatedUi;
  selectedPage?: UiNode;
  selectedPageId: string | null;
  setSelectedPageId: (id: string) => void;
  actorId: string;
}) {
  const [draft, setDraft] = useState(evaluated.requestData);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDraft(evaluated.requestData);
  }, [evaluated.requestData]);

  const save = useMutation({
    mutationFn: () =>
      api(`/api/request-cases/${evaluated.requestCaseId}/request-data?actorId=${actorId}`, {
        method: "PUT",
        body: JSON.stringify(draft),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluated-ui"] }),
  });

  const action = useMutation({
    mutationFn: (actionId: string) =>
      api(`/api/request-cases/${evaluated.requestCaseId}/actions/${actionId}?actorId=${actorId}`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluated-ui"] }),
  });

  const visiblePages = evaluated.pages.filter((page) => page.visible);

  return (
    <div className="grid grid-cols-[230px_minmax(0,1fr)_360px] gap-4">
      <aside className="panel self-start p-2">
        <div className="px-2 pb-2 text-xs font-semibold uppercase text-slate-500">Pages</div>
        {visiblePages.map((page) => (
          <button
            key={page.id}
            className={`nav-item ${selectedPageId === page.id ? "active" : ""}`}
            onClick={() => setSelectedPageId(page.id)}
          >
            {page.label}
          </button>
        ))}
      </aside>

      <section className="space-y-4">
        <StatusBar evaluated={evaluated} />
        <ValidationSummary evaluated={evaluated} />
        <WorkflowActions actions={evaluated.workflowActions} runAction={(id) => action.mutate(id)} pending={action.isPending} />
        {action.data ? <ActionMessage result={action.data as { success: boolean; message: string }} /> : null}
        {selectedPage && (
          <div className="panel">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-semibold">{selectedPage.label}</h2>
              <button className="button" onClick={() => save.mutate()} disabled={save.isPending || !evaluated.canSave}>
                Save draft
              </button>
            </div>
            <div className="space-y-4">
              {(selectedPage.children ?? []).filter((node) => node.visible).map((node) => (
                <RenderNode key={node.id} node={node} data={draft} setData={setDraft} actorRole={evaluated.actor.role} runAction={(id) => action.mutate(id)} />
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <TracePanel pages={evaluated.pages} />
      </aside>
    </div>
  );
}

function ActionMessage({ result }: { result: { success: boolean; message: string } }) {
  return <div className={`panel text-sm ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{result.message}</div>;
}

function StatusBar({ evaluated }: { evaluated: EvaluatedUi }) {
  return (
    <div className="panel grid grid-cols-4 gap-3 text-sm">
      <Stat label="Workflow" value={evaluated.workflowState} />
      <Stat label="Actor" value={`${evaluated.actor.displayName}`} />
      <Stat label="Variant" value={String(evaluated.derived.investmentVariant ?? "N/A")} />
      <Stat label="Approval Route" value={routeStatus(evaluated.calculations.approvalRoute)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function routeStatus(route: any) {
  if (!route?.exists) return "Not calculated";
  if (route.stale) return "Stale";
  return route.result?.requiredLevels?.join(", ") ?? "Fresh";
}

function ValidationSummary({ evaluated }: { evaluated: EvaluatedUi }) {
  const issues = [...(evaluated.validation.submit ?? []), ...(evaluated.validation.approve ?? [])];
  if (issues.length === 0) {
    return <div className="panel border-emerald-200 bg-emerald-50 text-sm text-emerald-800">No blocking submit/approve validation issues.</div>;
  }
  return (
    <div className="panel border-amber-200 bg-amber-50">
      <div className="mb-2 text-sm font-semibold text-amber-900">Blocking validation summary</div>
      <ul className="space-y-1 text-sm text-amber-900">
        {issues.map((issue) => (
          <li key={`${issue.ruleId}-${issue.message}`}>- {issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

function WorkflowActions({ actions, runAction, pending }: { actions: WorkflowAction[]; runAction: (id: string) => void; pending: boolean }) {
  const available = actions.filter((action) => action.visible);
  if (available.length === 0) {
    return null;
  }
  return (
    <div className="panel flex flex-wrap gap-2">
      {available.map((action) => (
        <button className={action.id.includes("decline") || action.id.includes("withdraw") ? "button secondary" : "button"} key={action.id} onClick={() => runAction(action.id)} disabled={pending || action.disabled}>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function RenderNode({
  node,
  data,
  setData,
  actorRole,
  runAction,
}: {
  node: UiNode;
  data: Record<string, any>;
  setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  actorRole: string;
  runAction: (id: string) => void;
}) {
  if (node.type === "collection" && node.dataPath === "founders") {
    return <FoundersTable node={node} data={data} setData={setData} />;
  }
  if (node.type === "collection" && node.dataPath === "exceptions") {
    return <ExceptionList node={node} data={data} setData={setData} actorRole={actorRole} />;
  }
  if (node.type === "calculation") {
    return <ActionPanel node={node} runAction={runAction} />;
  }
  if (node.type === "summary") {
    return <pre className="overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-50">{JSON.stringify(data, null, 2)}</pre>;
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
}

function Field({ node, value, onChange }: { node: UiNode; value: any; onChange: (value: any) => void }) {
  const disabled = node.disabled;
  const options = enumOptions[node.dataPath ?? ""] ?? [];
  if (node.component === "textarea") {
    return (
      <label className="field">
        <span>{node.label}</span>
        <textarea className="control min-h-24" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (node.component === "dropdown") {
    return (
      <label className="field">
        <span>{node.label}</span>
        <select className="control" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select...</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (node.component === "radioGroup") {
    return (
      <div className="field">
        <span>{node.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input type="radio" checked={value === option.value} disabled={disabled} onChange={() => onChange(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (node.component === "checkboxGroup") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="field">
        <span>{node.label}</span>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value))}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    );
  }
  const inputType = node.component === "dateInput" ? "date" : node.component === "currencyInput" ? "number" : "text";
  return (
    <label className="field">
      <span>{node.label}</span>
      <input className="control" type={inputType} value={value ?? ""} disabled={disabled} onChange={(event) => onChange(inputType === "number" ? Number(event.target.value) : event.target.value)} />
    </label>
  );
}

function FoundersTable({ node, data, setData }: { node: UiNode; data: Record<string, any>; setData: React.Dispatch<React.SetStateAction<Record<string, any>>> }) {
  const founders = Array.isArray(data.founders) ? data.founders : [];
  const disabled = node.disabled;
  const update = (index: number, field: string, value: any) => {
    setData((current) => ({ ...current, founders: founders.map((founder: any, i: number) => (i === index ? { ...founder, [field]: value } : founder)) }));
  };
  return (
    <section className="subpanel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{node.label}</h3>
        <button className="button secondary" disabled={disabled} onClick={() => setData((current) => ({ ...current, founders: [...founders, { name: "", title: "", ownershipPercent: 0, backgroundCheck: "NA" }] }))}>
          Add founder
        </button>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Ownership %</th>
              <th>Background</th>
            </tr>
          </thead>
          <tbody>
            {founders.map((founder: any, index: number) => (
              <tr key={index}>
                <td><input className="control" value={founder.name ?? ""} disabled={disabled} onChange={(event) => update(index, "name", event.target.value)} /></td>
                <td><input className="control" value={founder.title ?? ""} disabled={disabled} onChange={(event) => update(index, "title", event.target.value)} /></td>
                <td><input className="control" type="number" value={founder.ownershipPercent ?? 0} disabled={disabled} onChange={(event) => update(index, "ownershipPercent", Number(event.target.value))} /></td>
                <td>
                  <select className="control" value={founder.backgroundCheck ?? "NA"} disabled={disabled} onChange={(event) => update(index, "backgroundCheck", event.target.value)}>
                    {yesNoNa().map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExceptionList({ node, data, setData, actorRole }: { node: UiNode; data: Record<string, any>; setData: React.Dispatch<React.SetStateAction<Record<string, any>>>; actorRole: string }) {
  const exceptions = Array.isArray(data.exceptions) ? data.exceptions : [];
  const visible = exceptions.filter((item: any) => item.createdBy?.role === node.filter?.value);
  const disabled = node.disabled;
  const update = (id: string, patch: Record<string, any>) => {
    setData((current) => ({
      ...current,
      exceptions: exceptions.map((item: any) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };
  const addException = () => {
    const role = actorRole === "RiskOfficer" ? "RiskOfficer" : "InvestmentAnalyst";
    setData((current) => ({
      ...current,
      exceptions: [
        ...exceptions,
        { id: `ex-${Date.now()}`, description: "", severity: "MEDIUM", createdBy: { userId: role, role }, riskConfirmation: "" },
      ],
    }));
  };
  return (
    <section className="subpanel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{node.label}</h3>
        {(node.actions ?? []).filter((action) => action.visible).map((action) => (
          <button key={action.id} className="button secondary" disabled={action.disabled} onClick={addException}>Add exception</button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((item: any) => (
          <div className="rounded border border-slate-200 p-3" key={item.id}>
            <textarea className="control min-h-16" value={item.description ?? ""} disabled={disabled} onChange={(event) => update(item.id, { description: event.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <select className="control w-40" value={item.severity ?? "MEDIUM"} disabled={disabled} onChange={(event) => update(item.id, { severity: event.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              {item.createdBy?.role === "InvestmentAnalyst" && actorRole === "RiskOfficer" && (
                <select className="control w-52" value={item.riskConfirmation ?? ""} disabled={disabled} onChange={(event) => update(item.id, { riskConfirmation: event.target.value })}>
                  <option value="">Risk confirmation...</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REFER_BACK">Refer back</option>
                </select>
              )}
              <span className="text-xs text-slate-500">Created by {item.createdBy?.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionPanel({ node, runAction }: { node: UiNode; runAction: (id: string) => void }) {
  return (
    <section className="subpanel">
      <h3 className="mb-3 font-medium">{node.label}</h3>
      {(node.actions ?? []).filter((action) => action.visible).map((action) => (
        <button key={action.id} className="button" disabled={action.disabled} onClick={() => runAction(action.id)}>
          Calculate approval route
        </button>
      ))}
    </section>
  );
}

function TracePanel({ pages }: { pages: UiNode[] }) {
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
}

function TraceNode({ node }: { node: UiNode }) {
  return (
    <details className="rounded border border-slate-200 p-2 text-xs" open={node.visible === false}>
      <summary className="cursor-pointer font-medium">
        {node.label ?? node.id} <span className={node.visible ? "text-emerald-700" : "text-red-700"}>{node.visible ? "visible" : "hidden"}</span>
      </summary>
      <pre className="mt-2 overflow-auto rounded bg-slate-950 p-2 text-slate-100">{JSON.stringify(node.debug, null, 2)}</pre>
      {(node.children ?? []).map((child) => <TraceNode node={child} key={child.id} />)}
    </details>
  );
}

function getPath(data: Record<string, any>, path: string) {
  return path.split(".").reduce<any>((current, part) => current?.[part], data);
}

function setPath(data: Record<string, any>, path: string, value: any) {
  const clone = structuredClone(data);
  const parts = path.split(".");
  let current = clone;
  for (const part of parts.slice(0, -1)) {
    current[part] = current[part] ?? {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return clone;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
