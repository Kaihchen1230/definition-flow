import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UiNode } from "../../types/api";
import { Field } from "./Field";

const fieldNode = (overrides: Partial<UiNode>): UiNode => ({
  id: "indicators",
  type: "field",
  component: "checkboxGroup",
  label: "Applicable Risk Indicators",
  dataPath: "indicators",
  helperText: "Select every indicator that applies. Leave all options clear if none apply.",
  visible: true,
  enabled: true,
  disabled: false,
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  ...overrides,
});

afterEach(cleanup);

describe("Field helper text", () => {
  it("renders helper text from the field config", () => {
    render(<Field node={fieldNode({})} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("Select every indicator that applies. Leave all options clear if none apply.")).toBeTruthy();
    expect(screen.queryByText(/approval/i)).toBeNull();
  });

  it("explains why a configured field is read-only", () => {
    render(<Field node={fieldNode({ enabled: false, disabled: true })} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("Read-only for the current user and request stage.")).toBeTruthy();
  });
});

describe("dropdown adapter", () => {
  it("stores the configured option value through the active implementation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Field
        node={fieldNode({
          id: "companySector",
          component: "dropdown",
          dataPath: "company.sector",
          label: "Industry Sector",
          required: true,
        })}
        value="AI"
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: /Industry Sector/ });
    expect(trigger.textContent).toContain("AI");

    if (trigger instanceof HTMLSelectElement) {
      await user.selectOptions(trigger, "FINTECH");
    } else {
      await user.click(trigger);
      await user.click(screen.getByRole("option", { name: "FinTech" }));
    }

    expect(onChange).toHaveBeenCalledWith("FINTECH");
  });

  it("exposes invalid state through the active implementation", () => {
    render(
      <Field
        node={fieldNode({
          id: "companySector",
          component: "dropdown",
          dataPath: "company.sector",
          label: "Industry Sector",
        })}
        value=""
        invalid
        onChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Industry Sector" });
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });
});
