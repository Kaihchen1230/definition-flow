import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { enumOptions } from "../../../../config/enumOptions";
import { CustomDropdown } from "./CustomDropdown";
import { NativeDropdown } from "./NativeDropdown";

const commonProps = {
  id: "companySector",
  labelId: "companySector-label",
  value: "",
  options: enumOptions["company.sector"],
  disabled: false,
  invalid: false,
};

afterEach(cleanup);

describe("dropdown implementations", () => {
  it("supports keyboard selection in the custom dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <>
        <span id="companySector-label">Industry Sector</span>
        <CustomDropdown {...commonProps} onChange={onChange} />
      </>,
    );

    const trigger = screen.getByRole("combobox", { name: "Industry Sector" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("FINTECH");
  });

  it("keeps the native fallback compatible with the same contract", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <>
        <span id="companySector-label">Industry Sector</span>
        <NativeDropdown {...commonProps} onChange={onChange} />
      </>,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Industry Sector" }), "FINTECH");

    expect(onChange).toHaveBeenCalledWith("FINTECH");
  });
});
