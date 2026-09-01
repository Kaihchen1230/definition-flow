import type { UiNavigationGroup } from "../config/uiDefinition";
import type { UiNode } from "../types/api";
import type { PageCompletion } from "./pageCompletion";

export type VisibleNavigationGroup = {
  id: string;
  label: string;
  pages: UiNode[];
  complete: boolean;
  missingCount: number;
};

export const flattenNavigationPages = (groups: UiNavigationGroup[]) => groups.flatMap((group) => group.pages);

export const deriveVisibleNavigationGroups = (
  groups: UiNavigationGroup[],
  evaluatedPages: UiNode[],
  completionByPageId: ReadonlyMap<string, PageCompletion>
): VisibleNavigationGroup[] => {
  const evaluatedPagesById = new Map(evaluatedPages.map((page) => [page.id, page]));

  return groups.flatMap((group) => {
    const pages = group.pages
      .map((page) => evaluatedPagesById.get(page.id))
      .filter((page): page is UiNode => Boolean(page?.visible));
    if (pages.length === 0) {
      return [];
    }
    const completions = pages.map((page) => completionByPageId.get(page.id));
    return [{
      id: group.id,
      label: group.label,
      pages,
      complete: completions.every((completion) => completion?.complete ?? true),
      missingCount: completions.reduce((total, completion) => total + (completion?.missingCount ?? 0), 0),
    }];
  });
};

export const flattenVisibleNavigationPages = (groups: VisibleNavigationGroup[]) => groups.flatMap((group) => group.pages);

export const findNavigationGroupId = (groups: VisibleNavigationGroup[], pageId: string | null) =>
  groups.find((group) => group.pages.some((page) => page.id === pageId))?.id ?? null;

export const findAdjacentPageId = (groups: VisibleNavigationGroup[], pageId: string | null, offset: -1 | 1) => {
  const pages = flattenVisibleNavigationPages(groups);
  const currentIndex = pages.findIndex((page) => page.id === pageId);
  const adjacentIndex = currentIndex + offset;
  return currentIndex >= 0 && adjacentIndex >= 0 && adjacentIndex < pages.length ? pages[adjacentIndex].id : null;
};
