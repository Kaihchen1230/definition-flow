import { describe, expect, it } from "vitest";
import type { UiNode } from "../types/api";
import { evaluatePageCompletion } from "./pageCompletion";

const collectionPage = (requiredFields: string[]): UiNode => ({
  id: "ownersPage",
  type: "page",
  visible: true,
  enabled: true,
  disabled: false,
  children: [
    {
      id: "owners",
      type: "collection",
      dataPath: "owners",
      requiredFields,
      visible: true,
      enabled: true,
      disabled: false,
    },
  ],
});

describe("evaluatePageCompletion", () => {
  it("validates nested required fields inside collection rows", () => {
    const completion = evaluatePageCompletion(collectionPage(["profile.name", "profile.address.city"]), {
      owners: [
        { profile: { name: "Avery", address: { city: "Boston" } } },
        { profile: { name: "Morgan", address: { city: "" } } },
      ],
    });

    expect(completion.complete).toBe(false);
    expect(completion.requiredCount).toBe(4);
    expect(completion.missingCount).toBe(1);
    expect([...completion.missingPaths]).toEqual(["owners.1.profile.address.city"]);
  });
});
