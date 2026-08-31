import { describe, expect, it } from "vitest";
import { startupInvestmentUiDefinitionErrors } from "./uiDefinition";

describe("startup investment UI definition", () => {
  it("uses only registered components, rules, options, data paths, and unique node ids", () => {
    expect(startupInvestmentUiDefinitionErrors).toEqual([]);
  });
});
