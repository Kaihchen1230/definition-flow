import { Provider } from "react-redux";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  });

  it("shows validation messages only after the first submit action attempt in the session", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: false, message: "Blocking validations must be resolved.", details: {} })))
    );

    renderWorkbench();

    expect(screen.queryByText("Approval route must be calculated before submit.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Submit for investment approval" }));

    expect(await screen.findByText(/Approval route must be calculated before submit\./)).toBeTruthy();
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
});
