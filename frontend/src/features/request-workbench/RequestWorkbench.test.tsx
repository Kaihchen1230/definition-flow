import { Provider } from "react-redux";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../../store/store";
import type { EvaluatedUi } from "../../types/api";
import { RequestWorkbench } from "./RequestWorkbench";

const evaluatedUi: EvaluatedUi = {
  requestCaseId: "11111111-1111-1111-1111-111111111111",
  requestType: "startupInvestment",
  workflowState: "INVESTMENT_REVIEW",
  user: { userId: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst", entitlements: ["EDIT_INVESTMENT_REQUEST"] },
  requestData: {
    company: { name: "Acme Robotics" },
    investment: { amount: 6500000 },
    internal: { note: "Hidden from this user" },
  },
  derived: { investmentVariant: "HIGH_RISK" },
  calculations: { approvalRoute: { exists: false, stale: true } },
  definitionVersions: {},
  canSave: true,
  ruleResults: {},
  pages: [
    {
      id: "investmentTerms",
      type: "page",
      label: "Investment Terms",
      visible: true,
      enabled: true,
      disabled: false,
      visibleRule: null,
      enabledRule: null,
      required: false,
      requiredRule: null,
      children: [
        {
          id: "companyName",
          type: "field",
          component: "textInput",
          label: "Company name",
          dataPath: "company.name",
          visible: true,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: true,
          requiredRule: null,
        },
        {
          id: "internalNote",
          type: "field",
          component: "textInput",
          label: "Internal note",
          dataPath: "internal.note",
          visible: false,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: false,
          requiredRule: null,
        },
      ],
    },
  ],
  workflowActions: [
    {
      id: "workflow.submitInvestmentReview",
      label: "Submit for investment approval",
      visible: true,
      enabled: true,
      disabled: false,
    },
  ],
  validation: {
    render: [],
    submit: [
      {
        ruleId: "approvalRouteMustBeFresh",
        severity: "blocking",
        message: "Approval route must be calculated before submit.",
        path: "calculations.approvalRoute.exists",
      },
    ],
    riskSubmit: [],
    approve: [],
  },
};

const renderWorkbench = () => {
  const store = createStore();
  return render(
    <Provider store={store}>
      <RequestWorkbench
        evaluated={evaluatedUi}
        selectedPage={evaluatedUi.pages[0]}
        selectedPageId="investmentTerms"
        setSelectedPageId={vi.fn()}
        userId="analyst"
      />
    </Provider>
  );
};

const renderWorkbenchWith = (ui: EvaluatedUi, selectedPageId = ui.pages[0].id) => {
  const store = createStore();
  return render(
    <Provider store={store}>
      <RequestWorkbench
        evaluated={ui}
        selectedPage={ui.pages.find((page) => page.id === selectedPageId)}
        selectedPageId={selectedPageId}
        setSelectedPageId={vi.fn()}
        userId="analyst"
      />
    </Provider>
  );
};

describe("RequestWorkbench validation mode", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows the submit action result without the blocking validation summary panel", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: false, message: "Blocking validations must be resolved.", details: {} })))
    );

    renderWorkbench();

    expect(screen.queryByText("Blocking validation summary")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Submit for investment approval" }));

    expect(await screen.findByText(/Blocking validations must be resolved\./)).toBeTruthy();
    expect(screen.queryByText("Blocking validation summary")).toBeNull();
  });

  it("saves only data paths from the selected page", async () => {
    const user = userEvent.setup();
    const requestBodies: any[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input, init) => {
        const request = input instanceof Request ? input : undefined;
        const method = request?.method ?? init?.method;
        if (method === "PATCH") {
          requestBodies.push(request ? await request.clone().json() : JSON.parse(init?.body as string));
        }
        return new Response(JSON.stringify({ success: true, message: "Saved", details: {} }));
      })
    );

    renderWorkbench();

    await user.click(screen.getByRole("button", { name: "Save page" }));

    await waitFor(() => expect(requestBodies).toHaveLength(1));
    expect(requestBodies[0]).toEqual({
      updates: [{ path: "company.name", value: "Acme Robotics" }],
    });
  });

  it("auto-saves changed data paths from the selected page", async () => {
    vi.useFakeTimers();
    const requestBodies: any[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input, init) => {
        const request = input instanceof Request ? input : undefined;
        const method = request?.method ?? init?.method;
        if (method === "PATCH") {
          requestBodies.push(request ? await request.clone().json() : JSON.parse(init?.body as string));
        }
        return new Response(JSON.stringify({ success: true, message: "Saved", details: {} }));
      })
    );

    renderWorkbench();

    fireEvent.change(screen.getByDisplayValue("Acme Robotics"), { target: { value: "Acme Labs" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(requestBodies).toHaveLength(1);
    expect(requestBodies[0]).toEqual({
      updates: [{ path: "company.name", value: "Acme Labs" }],
    });
  });

  it("flushes pending page changes before running a workflow action", async () => {
    const user = userEvent.setup();
    const methods: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input, init) => {
        const request = input instanceof Request ? input : undefined;
        methods.push(request?.method ?? init?.method ?? "GET");
        return new Response(JSON.stringify({ success: true, message: "Saved", details: {} }));
      })
    );

    renderWorkbench();

    await user.clear(screen.getByDisplayValue("Acme Robotics"));
    await user.type(screen.getByRole("textbox", { name: /Company name/ }), "Acme Labs");
    await user.click(screen.getByRole("button", { name: "Submit for investment approval" }));

    await waitFor(() => expect(methods).toEqual(["PATCH", "POST"]));
  });

  it("marks missing required founder fields before submitting investment approval", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true, message: "Submitted", details: {} })));
    vi.stubGlobal("fetch", fetch);
    const ui: EvaluatedUi = {
      ...evaluatedUi,
      requestData: {
        ...evaluatedUi.requestData,
        founders: [{ name: "", title: "CEO", ownershipPercent: 60, backgroundCheck: "YES" }],
      },
      pages: [
        {
          id: "foundersOwnership",
          type: "page",
          label: "Founders & Ownership",
          visible: true,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: false,
          requiredRule: null,
          children: [
            {
              id: "foundersTable",
              type: "collection",
              component: "editableTable",
              dataPath: "founders",
              label: "Founders",
              requiredFields: ["name", "title", "ownershipPercent", "backgroundCheck"],
              visible: true,
              enabled: true,
              disabled: false,
              visibleRule: null,
              enabledRule: null,
              required: true,
              requiredRule: null,
            },
          ],
        },
      ],
    };

    renderWorkbenchWith(ui, "foundersOwnership");

    await user.click(screen.getByRole("button", { name: "Submit for investment approval" }));

    expect(screen.getByLabelText("Founder name").getAttribute("aria-invalid")).toBe("true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows removing founder rows when the table can add rows", async () => {
    const user = userEvent.setup();
    const ui: EvaluatedUi = {
      ...evaluatedUi,
      requestData: {
        ...evaluatedUi.requestData,
        founders: [{ name: "Morgan Lee", title: "CEO", ownershipPercent: 60, backgroundCheck: "YES" }],
      },
      pages: [
        {
          id: "foundersOwnership",
          type: "page",
          label: "Founders & Ownership",
          visible: true,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: false,
          requiredRule: null,
          children: [
            {
              id: "foundersTable",
              type: "collection",
              component: "editableTable",
              dataPath: "founders",
              label: "Founders",
              requiredFields: ["name", "title", "ownershipPercent", "backgroundCheck"],
              visible: true,
              enabled: true,
              disabled: false,
              visibleRule: null,
              enabledRule: null,
              required: true,
              requiredRule: null,
            },
          ],
        },
      ],
    };

    renderWorkbenchWith(ui, "foundersOwnership");

    expect(screen.getByLabelText("Founder name")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Remove founder 1" }));

    expect(screen.queryByLabelText("Founder name")).toBeNull();
  });
});
