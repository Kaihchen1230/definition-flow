import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UiNode } from "../../../types/api";
import { CheckboxGroupField } from "./checkbox/CheckboxGroupField";
import { CurrencyField } from "./currency/CurrencyField";
import { DropdownField } from "./dropdown/DropdownField";
import { RadioGroupField } from "./radio/RadioGroupField";

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

describe("field presentation", () => {
  it("renders helper text from the field config", () => {
    render(<CheckboxGroupField node={fieldNode({})} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("Select every indicator that applies. Leave all options clear if none apply.")).toBeTruthy();
    expect(screen.queryByText(/approval/i)).toBeNull();
  });

  it("explains why a configured field is read-only", () => {
    render(<CheckboxGroupField node={fieldNode({ enabled: false, disabled: true })} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText("Read-only for the current user and request stage.")).toBeTruthy();
  });
});

describe("radio group", () => {
  it("explains the SAFE abbreviation with a keyboard-focusable tooltip", () => {
    render(
      <RadioGroupField
        node={fieldNode({
          id: "investmentInstrument",
          component: "radioGroup",
          dataPath: "investment.instrument",
          label: "Investment Instrument",
        })}
        value="EQUITY"
        onChange={vi.fn()}
      />
    );

    const help = screen.getByRole("button", { name: "About SAFE" });
    const description = screen.getByRole("tooltip");
    expect(description.textContent).toContain("Simple Agreement for Future Equity");
    expect(help.getAttribute("aria-describedby")).toBe(description.id);
  });
});

describe("currency field", () => {
  it("formats currency for scanning and exposes an unformatted value while editing", async () => {
    const user = userEvent.setup();
    const CurrencyHarness = () => {
      const [value, setValue] = useState<number | "">(30000000000);
      return (
        <CurrencyField
          node={fieldNode({
            id: "investmentAmount",
            component: "currencyInput",
            dataPath: "investment.amount",
            label: "Proposed Investment Amount",
            helperText: undefined,
            constraints: { min: 1, step: 1, currency: "USD" },
          })}
          value={value}
          onChange={setValue}
        />
      );
    };

    render(<CurrencyHarness />);
    const input = screen.getByRole("textbox", { name: "Proposed Investment Amount" }) as HTMLInputElement;
    expect(input.value).toBe("$30,000,000,000");

    await user.click(input);
    expect(input.value).toBe("30000000000");
    await user.clear(input);
    await user.type(input, "4250000");
    expect(input.value).toBe("4250000");
    await user.tab();
    expect(input.value).toBe("$4,250,000");
  });
});

describe("dropdown field", () => {
  it("stores the configured option value through the active implementation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DropdownField
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
      <DropdownField
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
