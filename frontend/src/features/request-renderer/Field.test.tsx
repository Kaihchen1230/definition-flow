import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
