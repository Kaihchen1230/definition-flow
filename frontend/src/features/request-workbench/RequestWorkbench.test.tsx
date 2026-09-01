import { Provider } from "react-redux";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { companyProfilePage } from "../../config/pages/companyProfile";
import { createStore } from "../../store/store";
import type { EvaluatedUi } from "../../types/api";
import { evaluateUiDefinition } from "../../utils/evaluateUiDefinition";
import { RequestWorkbench } from "./RequestWorkbench";

const evaluatedUi: EvaluatedUi = {
  requestCaseId: "11111111-1111-1111-1111-111111111111",
  requestType: "startupInvestment",
  workflowState: "INVESTMENT_REVIEW",
  user: { userId: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst", entitlements: ["EDIT_INVESTMENT_REQUEST"] },
  requestData: {
    company: { name: "Acme Robotics", stage: "SEED", sector: "AI", foundedDate: "2024-01-01", incorporated: "YES" },
    investment: { amount: 6500000, instrument: "SAFE", useOfFunds: "Growth" },
    approvalRequirements: { investmentLevels: ["LEVEL_3"] },
    founders: [{ name: "Mina", title: "CEO", ownershipPercent: 60, backgroundCheck: "YES" }],
    exceptions: [],
    internal: { note: "Hidden from this user" },
  },
  derived: { investmentVariant: "HIGH_RISK" },
  calculations: {},
  definitionVersions: {},
  canSave: true,
  ruleResults: {
    showInternalNote: { result: false, trace: [] },
  },
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
          visibleRule: "showInternalNote",
          enabledRule: null,
          required: false,
          requiredRule: null,
        },
      ],
    },
  ],
  workflowActions: [
    {
      id: "workflow.submitInvestmentReviewLevel3",
      label: "Submit to Investment Level 3",
      enabledRule: "canSubmitInvestmentLevel3",
      visible: true,
      enabled: true,
      disabled: false,
    },
  ],
  validation: {
    render: [],
    submit: [
      {
        ruleId: "investmentApprovalLevelRequired",
        severity: "blocking",
        message: "Select the required investment approver level.",
        path: "investmentApprovalLevel",
      },
    ],
    riskSubmit: [],
    approve: [],
  },
};

const navigationGroupsFor = (pages: EvaluatedUi["pages"]) => [{ id: "request", label: "Request", pages }];

const renderWorkbench = () => {
  const store = createStore();
  return render(
    <Provider store={store}>
      <RequestWorkbench
        evaluated={evaluatedUi}
        navigationGroups={navigationGroupsFor(evaluatedUi.pages)}
        selectedPage={evaluatedUi.pages[0]}
        selectedPageId="investmentTerms"
        setSelectedPageId={vi.fn()}
        userId="analyst"
      />
    </Provider>
  );
};

const renderWorkbenchWith = (
  ui: EvaluatedUi,
  selectedPageId = ui.pages[0].id,
  setSelectedPageId = vi.fn(),
  navigationGroups = navigationGroupsFor(ui.pages)
) => {
  const store = createStore();
  const view = render(
    <Provider store={store}>
      <RequestWorkbench
        evaluated={ui}
        navigationGroups={navigationGroups}
        selectedPage={ui.pages.find((page) => page.id === selectedPageId)}
        selectedPageId={selectedPageId}
        setSelectedPageId={setSelectedPageId}
        userId={ui.user.userId}
      />
    </Provider>
  );
  return { ...view, store };
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

    await user.click(screen.getByRole("button", { name: "Submit to Investment Level 3" }));

    expect(await screen.findByText(/Blocking validations must be resolved\./)).toBeTruthy();
    expect(screen.queryByText("Blocking validation summary")).toBeNull();
  });

  it("saves only data paths from the selected page", async () => {
    const user = userEvent.setup();
    const requestBodies: any[] = [];
    const frontendRuleCatalogVersions: Array<string | null> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input, init) => {
        const request = input instanceof Request ? input : undefined;
        const method = request?.method ?? init?.method;
        if (method === "PATCH") {
          requestBodies.push(request ? await request.clone().json() : JSON.parse(init?.body as string));
          frontendRuleCatalogVersions.push(request?.headers.get("X-Frontend-Rule-Catalog-Version") ?? null);
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
    expect(frontendRuleCatalogVersions).toEqual(["startup-investment-rules-v6"]);
  });

  it("shows a visible error when the current page cannot be saved", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Failed" }, { status: 500 })));

    renderWorkbench();

    await user.click(screen.getByRole("button", { name: "Save page" }));

    expect(await screen.findByText("Page could not be saved. Try again.")).toBeTruthy();
  });

  it("shows a visible error when a workflow action fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Failed" }, { status: 500 })));

    renderWorkbench();

    await user.click(screen.getByRole("button", { name: "Submit to Investment Level 3" }));

    expect(await screen.findByText("Workflow action failed. Try again.")).toBeTruthy();
  });

  it("does not save page changes on a debounce timer", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true, message: "Saved", details: {} })));
    vi.stubGlobal("fetch", fetch);

    renderWorkbench();

    fireEvent.change(screen.getByDisplayValue("Acme Robotics"), { target: { value: "Acme Labs" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("saves changed data paths before navigating to another page", async () => {
    const requestBodies: any[] = [];
    const setSelectedPageId = vi.fn();
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

    const ui: EvaluatedUi = {
      ...evaluatedUi,
      pages: [
        ...evaluatedUi.pages,
        {
          id: "companyProfile",
          type: "page",
          label: "Company Profile",
          visible: true,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: false,
          requiredRule: null,
          children: [],
        },
      ],
    };
    renderWorkbenchWith(ui, "investmentTerms", setSelectedPageId);

    fireEvent.change(screen.getByDisplayValue("Acme Robotics"), { target: { value: "Acme Labs" } });
    fireEvent.click(screen.getByRole("button", { name: /Company Profile/ }));

    await waitFor(() => expect(requestBodies).toHaveLength(1));
    expect(requestBodies[0]).toEqual({
      updates: [{ path: "company.name", value: "Acme Labs" }],
    });
    expect(setSelectedPageId).toHaveBeenCalledWith("companyProfile");
  });

  it("shows and requires a refer-back note immediately from draft data", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true, message: "Saved", details: {} })));
    vi.stubGlobal("fetch", fetch);
    const riskContext = {
      ...evaluatedUi,
      workflowState: "RISK_REVIEW",
      user: { userId: "risk-officer", displayName: "Riley Risk Officer", role: "RiskOfficer", entitlements: ["EDIT_RISK_REVIEW"] },
      requestData: {
        ...evaluatedUi.requestData,
        risk: {
          pageConfirmations: { companyProfile: "CONFIRMED" },
          pageConfirmationNotes: { companyProfile: "" },
        },
      },
      ruleResults: {
        canEditInvestmentReview: { result: false, trace: [] },
        canEditRiskReview: { result: true, trace: [] },
        showRiskOfficerConfirmations: { result: true, trace: [] },
      },
    };
    const ui: EvaluatedUi = {
      ...riskContext,
      pages: evaluateUiDefinition([companyProfilePage], riskContext),
    };

    renderWorkbenchWith(ui, "companyProfile");

    expect(screen.queryByLabelText(/Reason for referring the company profile back/)).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Refer back" }));

    const note = screen.getByLabelText(/Reason for referring the company profile back/);
    expect(note).toBeTruthy();
    expect(note.closest("label")?.textContent).toContain("Reason for referring the company profile back *");
    expect(fetch).not.toHaveBeenCalled();
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
    await user.click(screen.getByRole("button", { name: "Submit to Investment Level 3" }));

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

    await user.click(screen.getByRole("button", { name: "Submit to Investment Level 3" }));

    expect(screen.getByLabelText("Founder name").getAttribute("aria-invalid")).toBe("true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not start investment review or leave the open page while another visible page is incomplete", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true, message: "Started", details: {} })));
    const setSelectedPageId = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const ui: EvaluatedUi = {
      ...evaluatedUi,
      workflowState: "DRAFT",
      requestData: { company: { name: "" } },
      workflowActions: [
        {
          id: "workflow.startInvestmentReview",
          label: "Start investment review",
          enabledRule: "canEditInvestmentReview",
          visible: true,
          enabled: true,
          disabled: false,
        },
      ],
      pages: [
        {
          id: "companyProfile",
          type: "page",
          label: "Company Profile",
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
          ],
        },
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
          children: [],
        },
      ],
    };

    renderWorkbenchWith(ui, "investmentTerms", setSelectedPageId);

    await user.click(screen.getByRole("button", { name: "Start investment review" }));

    expect(screen.getByRole("heading", { name: "Investment Terms" })).toBeTruthy();
    expect(setSelectedPageId).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders grouped pages, protects the active group, and toggles inactive groups", async () => {
    const user = userEvent.setup();
    const companyProfile = { ...evaluatedUi.pages[0], id: "companyProfile", label: "Company Profile" };
    const foundersOwnership = emptyPage("foundersOwnership", "Founders & Ownership");
    const riskExceptions = requiredPage("riskExceptions", "Risk & Exceptions", "risk.missing");
    const ui = { ...evaluatedUi, pages: [companyProfile, foundersOwnership, riskExceptions] };
    const setSelectedPageId = vi.fn();
    const navigationGroups = [
      { id: "company", label: "Company", pages: [companyProfile, foundersOwnership] },
      { id: "riskReview", label: "Risk Review", pages: [riskExceptions] },
    ];

    renderWorkbenchWith(ui, "companyProfile", setSelectedPageId, navigationGroups);

    expect(screen.getByRole("button", { name: /Company Profile/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Risk & Exceptions/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Risk Review, incomplete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" }).hasAttribute("disabled")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Company, complete" }));
    expect(screen.getByRole("button", { name: /Company Profile/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Risk Review, incomplete" }));
    expect(setSelectedPageId).toHaveBeenCalledWith("riskExceptions");
    expect(screen.getByRole("button", { name: /Risk & Exceptions/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Risk Review, incomplete" }));
    expect(screen.queryByRole("button", { name: /Risk & Exceptions/ })).toBeNull();
  });

  it("moves Next across a group boundary and disables it on the final page", async () => {
    const user = userEvent.setup();
    const companyProfile = emptyPage("companyProfile", "Company Profile");
    const foundersOwnership = emptyPage("foundersOwnership", "Founders & Ownership");
    const riskExceptions = emptyPage("riskExceptions", "Risk & Exceptions");
    const ui = { ...evaluatedUi, pages: [companyProfile, foundersOwnership, riskExceptions] };
    const setSelectedPageId = vi.fn();
    const navigationGroups = [
      { id: "company", label: "Company", pages: [companyProfile, foundersOwnership] },
      { id: "riskReview", label: "Risk Review", pages: [riskExceptions] },
    ];

    const firstView = renderWorkbenchWith(ui, "foundersOwnership", setSelectedPageId, navigationGroups);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(setSelectedPageId).toHaveBeenCalledWith("riskExceptions");
    firstView.unmount();

    renderWorkbenchWith(ui, "riskExceptions", vi.fn(), navigationGroups);
    expect(screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")).toBe(true);
  });

  it("keeps the user on the current page when saving before Next fails", async () => {
    const user = userEvent.setup();
    const companyProfile = { ...evaluatedUi.pages[0], id: "companyProfile", label: "Company Profile" };
    const foundersOwnership = emptyPage("foundersOwnership", "Founders & Ownership");
    const ui = { ...evaluatedUi, pages: [companyProfile, foundersOwnership] };
    const setSelectedPageId = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Failed" }, { status: 500 })));

    renderWorkbenchWith(ui, "companyProfile", setSelectedPageId, [
      { id: "company", label: "Company", pages: [companyProfile, foundersOwnership] },
    ]);
    fireEvent.change(screen.getByDisplayValue("Acme Robotics"), { target: { value: "Acme Labs" } });
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Page could not be saved. Try again.")).toBeTruthy();
    expect(setSelectedPageId).not.toHaveBeenCalled();
  });

  it("resets manually expanded groups when the user changes", async () => {
    const user = userEvent.setup();
    const companyProfile = emptyPage("companyProfile", "Company Profile");
    const riskExceptions = emptyPage("riskExceptions", "Risk & Exceptions");
    const ui = { ...evaluatedUi, pages: [companyProfile, riskExceptions] };
    const setSelectedPageId = vi.fn();
    const navigationGroups = [
      { id: "company", label: "Company", pages: [companyProfile] },
      { id: "riskReview", label: "Risk Review", pages: [riskExceptions] },
    ];
    const view = renderWorkbenchWith(ui, "companyProfile", setSelectedPageId, navigationGroups);

    await user.click(screen.getByRole("button", { name: "Risk Review, complete" }));
    expect(screen.getByRole("button", { name: /Risk & Exceptions/ })).toBeTruthy();

    view.rerender(
      <Provider store={view.store}>
        <RequestWorkbench
          evaluated={ui}
          navigationGroups={navigationGroups}
          selectedPage={companyProfile}
          selectedPageId="companyProfile"
          setSelectedPageId={setSelectedPageId}
          userId="risk"
        />
      </Provider>
    );

    await waitFor(() => expect(screen.queryByRole("button", { name: /Risk & Exceptions/ })).toBeNull());
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

const emptyPage = (id: string, label: string): EvaluatedUi["pages"][number] => ({
  id,
  type: "page",
  label,
  visible: true,
  enabled: true,
  disabled: false,
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [],
});

const requiredPage = (id: string, label: string, dataPath: string): EvaluatedUi["pages"][number] => ({
  ...emptyPage(id, label),
  children: [{
    id: `${id}RequiredField`,
    type: "field",
    component: "textInput",
    label: "Required field",
    dataPath,
    visible: true,
    enabled: true,
    disabled: false,
    visibleRule: null,
    enabledRule: null,
    required: true,
    requiredRule: null,
  }],
});
