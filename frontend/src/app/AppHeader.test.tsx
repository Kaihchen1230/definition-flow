import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

const requests = [{
  id: "11111111-1111-1111-1111-111111111111",
  label: "High value / early stage",
  scenario: "Existing request",
  companyName: "Acme Robotics",
  workflowState: "DRAFT",
}];

const users = [{ id: "risk", displayName: "Riley Risk", role: "RiskOfficer" }];

describe("AppHeader", () => {
  afterEach(cleanup);

  it("formats the selected context and forwards toolbar interactions", () => {
    const onRequestChange = vi.fn();
    const onStartNewRequest = vi.fn();
    const onUserChange = vi.fn();

    render(
      <AppHeader
        hasUnsavedChanges={false}
        onRequestChange={onRequestChange}
        onStartNewRequest={onStartNewRequest}
        onUserChange={onUserChange}
        requestCaseId={requests[0].id}
        requests={requests}
        userId="risk"
        users={users}
      />
    );

    expect(screen.getByText("Case 11111111")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Acme Robotics (11111111)" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Riley Risk (Risk Officer)" })).toBeTruthy();
    expect(screen.getByText("Existing request")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Request"), { target: { value: requests[0].id } });
    fireEvent.change(screen.getByLabelText("User"), { target: { value: "risk" } });
    fireEvent.click(screen.getByRole("button", { name: "New request" }));

    expect(onRequestChange).toHaveBeenCalledWith(requests[0].id);
    expect(onUserChange).toHaveBeenCalledWith("risk");
    expect(onStartNewRequest).toHaveBeenCalledOnce();
  });

  it("disables context controls while the current page is dirty", () => {
    render(
      <AppHeader
        hasUnsavedChanges
        onRequestChange={vi.fn()}
        onStartNewRequest={vi.fn()}
        onUserChange={vi.fn()}
        requestCaseId={requests[0].id}
        requests={requests}
        userId="risk"
        users={users}
      />
    );

    expect((screen.getByLabelText("Request") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("User") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "New request" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
