import { Provider } from "react-redux";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../store/store";
import type { DemoRequest, RawEvaluationContext } from "../types/api";
import { App } from "./App";

const existingRequest: DemoRequest = {
  id: "11111111-1111-1111-1111-111111111111",
  label: "High value / early stage",
  scenario: "Existing request",
  companyName: "Acme Robotics",
  workflowState: "DRAFT",
};

const createdRequest: DemoRequest = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  label: "Untitled request",
  scenario: "New empty request",
  companyName: "",
  workflowState: "DRAFT",
};

const evaluationContext = (requestCaseId: string): RawEvaluationContext => ({
  requestCaseId,
  requestType: "startupInvestment",
  workflowState: "DRAFT",
  user: {
    userId: "analyst",
    displayName: "Avery Analyst",
    role: "InvestmentAnalyst",
    entitlements: ["EDIT_INVESTMENT_REQUEST"],
  },
  requestData: {},
  calculations: {},
  definitionVersions: {},
  workflowActions: [],
});

describe("App request creation", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates the request only after basic company information is complete", async () => {
    const user = userEvent.setup();
    let requestCatalogCalls = 0;
    let createCalls = 0;
    const patchBodies: any[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);

        if (url.pathname === "/api/dev/demo/users") {
          return Response.json([{ id: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst" }]);
        }

        if (url.pathname === "/api/dev/demo/requests") {
          requestCatalogCalls += 1;
          if (requestCatalogCalls > 1) {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return Response.json([existingRequest, { ...createdRequest, label: "Acme Robotics", companyName: "Acme Robotics" }]);
          }
          return Response.json([existingRequest]);
        }

        if (url.pathname === "/api/request-cases" && request.method === "POST") {
          createCalls += 1;
          return Response.json({
            id: createdRequest.id,
            requestType: "startupInvestment",
            workflowState: "DRAFT",
          });
        }

        if (url.pathname === `/api/request-cases/${createdRequest.id}/request-data` && request.method === "PATCH") {
          patchBodies.push(await request.clone().json());
          return Response.json({ success: true, message: "Saved" });
        }

        if (url.pathname.endsWith("/evaluation-context")) {
          const requestCaseId = url.pathname.split("/")[3];
          return Response.json(evaluationContext(requestCaseId));
        }

        throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
      })
    );

    const store = createStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(await screen.findByRole("heading", { name: "Start with the company" })).toBeTruthy();
    expect(createCalls).toBe(0);

    await user.click(screen.getByRole("button", { name: /Create request/ }));
    expect(screen.getByText("Complete the highlighted fields before creating the request.")).toBeTruthy();
    expect(createCalls).toBe(0);

    await user.type(screen.getByRole("textbox", { name: /Company Name/ }), "Acme Robotics");
    await user.click(screen.getByRole("radio", { name: "Seed" }));
    await user.selectOptions(screen.getByRole("combobox", { name: /Sector/ }), "AI");
    fireEvent.change(screen.getByLabelText(/Date Founded/), { target: { value: "2024-01-01" } });
    await user.click(screen.getByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: /Create request/ }));

    await waitFor(() => expect(requestCatalogCalls).toBeGreaterThan(1));
    await waitFor(() => expect(store.getState().requestWorkbench.requestCaseId).toBe(createdRequest.id));
    expect(createCalls).toBe(1);
    expect(patchBodies).toEqual([{ updates: [
      { path: "company.name", value: "Acme Robotics" },
      { path: "company.stage", value: "SEED" },
      { path: "company.sector", value: "AI" },
      { path: "company.foundedDate", value: "2024-01-01" },
      { path: "company.incorporated", value: "YES" },
    ] }]);
    expect(screen.getByText("Case aaaaaaaa")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Acme Robotics (aaaaaaaa)" })).toBeTruthy();
  });

  it("prevents context switches while the current page has unsaved changes", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);
        if (url.pathname === "/api/dev/demo/users") {
          return Response.json([{ id: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst" }]);
        }
        if (url.pathname === "/api/dev/demo/requests") {
          return Response.json([existingRequest, createdRequest]);
        }
        if (url.pathname === "/api/request-cases" && request.method === "POST") {
          return Response.json({ id: createdRequest.id, requestType: "startupInvestment", workflowState: "DRAFT" });
        }
        if (url.pathname.endsWith("/evaluation-context")) {
          return Response.json(evaluationContext(url.pathname.split("/")[3]));
        }
        throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
      })
    );

    const store = createStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await screen.findByRole("option", { name: "Acme Robotics (11111111)" });
    await user.selectOptions(screen.getByLabelText("Request"), existingRequest.id);
    await user.type(await screen.findByRole("textbox", { name: /Company Name/ }), "Acme");

    expect((screen.getByLabelText("Request") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("User") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "New request" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Save the current page before switching request or user.")).toBeTruthy();
  });

  it("keeps definition reload and demo reset controls out of the product UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : new Request(input, init);
        const url = new URL(request.url);
        if (url.pathname === "/api/dev/demo/users") {
          return Response.json([{ id: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst" }]);
        }
        if (url.pathname === "/api/dev/demo/requests") {
          return Response.json([existingRequest, createdRequest]);
        }
        if (url.pathname.endsWith("/evaluation-context")) {
          return Response.json(evaluationContext(url.pathname.split("/")[3]));
        }
        throw new Error(`Unexpected request: ${request.method} ${url.pathname}`);
      })
    );

    render(<Provider store={createStore()}><App /></Provider>);

    expect(await screen.findByRole("heading", { name: "Start with the company" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reload definitions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset demo" })).toBeNull();
  });
});
