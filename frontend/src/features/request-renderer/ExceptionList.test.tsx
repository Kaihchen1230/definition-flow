import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UiNode } from "../../types/api";
import { ExceptionList } from "./ExceptionList";

const node: UiNode = {
  id: "analystExceptions",
  type: "collection",
  component: "exceptionList",
  label: "Analyst exceptions",
  dataPath: "exceptions",
  filter: { path: "$item.createdBy.role", op: "eq", value: "InvestmentAnalyst" },
  requiredFields: ["description", "severity"],
  visible: true,
  enabled: true,
  disabled: false,
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  actions: [{ id: "add", type: "action", label: "Add exception", visible: true, enabled: true, disabled: false, visibleRule: null, enabledRule: null, required: false, requiredRule: null }],
};

describe("ExceptionList", () => {
  it("records the authenticated user id when an exception is added", () => {
    const setData = vi.fn();
    render(<ExceptionList node={node} data={{ exceptions: [] }} setData={setData} userId="analyst-42" userRole="InvestmentAnalyst" />);

    fireEvent.click(screen.getByRole("button", { name: "Add exception" }));

    const updater = setData.mock.calls[0][0];
    const next = updater({ exceptions: [] });
    expect(next.exceptions[0].createdBy).toEqual({ userId: "analyst-42", role: "InvestmentAnalyst" });
  });

  it("marks an incomplete exception description invalid after validation starts", () => {
    render(
      <ExceptionList
        node={node}
        data={{ exceptions: [{ id: "ex-1", description: "", severity: "HIGH", createdBy: { userId: "analyst", role: "InvestmentAnalyst" } }] }}
        setData={vi.fn()}
        userId="analyst"
        userRole="InvestmentAnalyst"
        missingPaths={new Set(["exceptions.0.description"])}
        validationActive
      />
    );

    expect(screen.getByRole("textbox", { name: "Description" }).getAttribute("aria-invalid")).toBe("true");
  });
});
