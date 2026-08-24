import { api } from "./client";
import type { Actor } from "../types/api";

export const demoRequestId = "11111111-1111-1111-1111-111111111111";

export const fetchDemoActors = () => api<Actor[]>("/api/dev/demo/actors");

export const resetDemoData = () => api("/api/dev/demo/reset", { method: "POST" });

export const reloadStartupInvestmentDefinitions = () => api("/api/dev/definitions/reload/startup-investment", { method: "POST" });
