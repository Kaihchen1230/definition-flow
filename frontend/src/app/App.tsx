import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demoRequestId, fetchDemoActors, reloadStartupInvestmentDefinitions, resetDemoData } from "../api/demo";
import { fetchEvaluatedUi } from "../api/requestCases";
import { RequestWorkbench } from "../features/request-workbench/RequestWorkbench";

export const App = () => {
  const queryClient = useQueryClient();
  const [actorId, setActorId] = useState("analyst");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const actors = useQuery({
    queryKey: ["actors"],
    queryFn: fetchDemoActors,
  });

  const evaluated = useQuery({
    queryKey: ["evaluated-ui", actorId],
    queryFn: () => fetchEvaluatedUi(demoRequestId, actorId),
  });

  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const reloadDefinitions = useMutation({
    mutationFn: reloadStartupInvestmentDefinitions,
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
          <RequestWorkbench
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
};
