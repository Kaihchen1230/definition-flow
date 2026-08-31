import { describe, expect, it } from "vitest";
import type { UiNavigationGroup } from "../config/uiDefinition";
import type { UiNode } from "../types/api";
import type { PageCompletion } from "./pageCompletion";
import {
  deriveVisibleNavigationGroups,
  findAdjacentPageId,
  findNavigationGroupId,
  flattenNavigationPages,
} from "./pageNavigation";

const pageConfig = (id: string) => ({
  id,
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
});

const evaluatedPage = (id: string, visible = true): UiNode => ({
  ...pageConfig(id),
  visible,
  enabled: true,
  disabled: false,
});

const groups: UiNavigationGroup[] = [
  { id: "company", label: "Company", pages: [pageConfig("profile"), pageConfig("ownership")] },
  { id: "risk", label: "Risk", pages: [pageConfig("exceptions")] },
];

const completion = (complete: boolean, missingCount: number): PageCompletion => ({
  complete,
  missingCount,
  missingPaths: new Set(),
  requiredCount: missingCount,
});

describe("pageNavigation", () => {
  it("flattens configured pages in group and child order", () => {
    expect(flattenNavigationPages(groups).map((page) => page.id)).toEqual(["profile", "ownership", "exceptions"]);
  });

  it("hides empty visible groups and aggregates visible child completion", () => {
    const completionByPageId = new Map([
      ["profile", completion(true, 0)],
      ["ownership", completion(false, 2)],
      ["exceptions", completion(false, 3)],
    ]);
    const visibleGroups = deriveVisibleNavigationGroups(
      groups,
      [evaluatedPage("profile"), evaluatedPage("ownership"), evaluatedPage("exceptions", false)],
      completionByPageId
    );

    expect(visibleGroups).toHaveLength(1);
    expect(visibleGroups[0]).toMatchObject({ id: "company", complete: false, missingCount: 2 });
    expect(visibleGroups[0].pages.map((page) => page.id)).toEqual(["profile", "ownership"]);
  });

  it("finds groups and adjacent visible pages across group boundaries", () => {
    const completionByPageId = new Map<string, PageCompletion>();
    const visibleGroups = deriveVisibleNavigationGroups(
      groups,
      [evaluatedPage("profile"), evaluatedPage("ownership"), evaluatedPage("exceptions")],
      completionByPageId
    );

    expect(findNavigationGroupId(visibleGroups, "ownership")).toBe("company");
    expect(findAdjacentPageId(visibleGroups, "ownership", 1)).toBe("exceptions");
    expect(findAdjacentPageId(visibleGroups, "exceptions", 1)).toBeNull();
    expect(findAdjacentPageId(visibleGroups, "profile", -1)).toBeNull();
  });
});
