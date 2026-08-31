import { describe, expect, it } from "vitest";
import type { UiConfigNode, UiNavigationGroup } from "./uiDefinition";
import { validateUiDefinition } from "./validateUiDefinition";

const field = (overrides: Partial<UiConfigNode> = {}): UiConfigNode => ({
  id: "companyName",
  type: "field",
  component: "textInput",
  dataPath: "company.name",
  visibleRule: null,
  enabledRule: null,
  required: true,
  requiredRule: null,
  ...overrides,
});

describe("validateUiDefinition", () => {
  it("reports invalid component, rule, data-path, option, and duplicate-id configuration", () => {
    const groups: UiNavigationGroup[] = [
      { id: "request", label: "Request", pages: [{
        id: "company",
        type: "page",
        visibleRule: "missingRule",
        enabledRule: null,
        required: false,
        requiredRule: null,
        children: [
          field({ component: "missingRenderer" as any, dataPath: "company.unknown" }),
          field({ component: "dropdown" }),
        ],
      }] },
      { id: "request", label: "Duplicate", pages: [] },
    ];

    expect(validateUiDefinition(groups, {
      componentIds: new Set(["textInput", "dropdown"]),
      dataPaths: new Set(["company.name"]),
      optionPaths: new Set(),
      ruleIds: new Set(["knownRule"]),
    })).toEqual([
      "Duplicate navigation group id: request",
      "Navigation group has no configured pages: request",
      "Duplicate UI node id: companyName",
      "Unknown visibleRule 'missingRule' on node company",
      "Unknown component 'missingRenderer' on node companyName",
      "Unknown dataPath 'company.unknown' on node companyName",
      "No options configured for dropdown node companyName at company.name",
    ]);
  });
});
