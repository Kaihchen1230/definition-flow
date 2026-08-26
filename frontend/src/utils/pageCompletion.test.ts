import { describe, expect, it } from "vitest";
import type { UiNode } from "../types/api";
import { evaluatePageCompletion } from "./pageCompletion";

const collectionPage = (requiredFields: string[]): UiNode => ({
  id: "ownersPage",
  type: "page",
  visible: true,
  enabled: true,
  disabled: false,
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    {
      id: "owners",
      type: "collection",
      dataPath: "owners",
      requiredFields,
      visible: true,
      enabled: true,
      disabled: false,
      visibleRule: null,
      enabledRule: null,
      required: true,
      requiredRule: null,
    },
  ],
});

describe("evaluatePageCompletion", () => {
  it("marks ordinary required fields as incomplete", () => {
    const page: UiNode = {
      id: "company",
      type: "page",
      visible: true,
      enabled: true,
      disabled: false,
      visibleRule: null,
      enabledRule: null,
      required: false,
      requiredRule: null,
      children: [
        {
          id: "companyName",
          type: "field",
          dataPath: "company.name",
          visible: true,
          enabled: true,
          disabled: false,
          visibleRule: null,
          enabledRule: null,
          required: true,
          requiredRule: null,
        },
      ],
    };

    const completion = evaluatePageCompletion(page, { company: { name: " " } });

    expect(completion.complete).toBe(false);
    expect([...completion.missingPaths]).toEqual(["company.name"]);
  });

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

  it("does not require an empty optional collection but validates rows when present", () => {
    const page = collectionPage(["description"]);
    page.children![0].required = false;

    expect(evaluatePageCompletion(page, { owners: [] }).complete).toBe(true);
    expect(evaluatePageCompletion(page, { owners: [{ description: "" }] }).complete).toBe(false);
  });
});
