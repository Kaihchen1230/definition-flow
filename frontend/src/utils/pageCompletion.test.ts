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

  it("marks a required multi-select field incomplete until at least one option is selected", () => {
    const page: UiNode = {
      id: "approvalRequirements",
      type: "page",
      visible: true,
      enabled: true,
      disabled: false,
      visibleRule: null,
      enabledRule: null,
      required: false,
      requiredRule: null,
      children: [{
        id: "investmentApprovalLevels",
        type: "field",
        component: "checkboxGroup",
        dataPath: "approvalRequirements.investmentLevels",
        visible: true,
        enabled: true,
        disabled: false,
        visibleRule: null,
        enabledRule: null,
        required: true,
        requiredRule: null,
      }],
    };

    expect(evaluatePageCompletion(page, { approvalRequirements: { investmentLevels: [] } }).complete).toBe(false);
    expect(evaluatePageCompletion(page, { approvalRequirements: { investmentLevels: ["LEVEL_2"] } }).complete).toBe(true);
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

  it("marks a founded date after today as incomplete", () => {
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
          id: "companyFoundedDate",
          type: "field",
          component: "dateInput",
          dataPath: "company.foundedDate",
          constraints: { maxDate: "today" },
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

    const completion = evaluatePageCompletion(page, { company: { foundedDate: "2026-08-31" } }, { today: "2026-08-30" });

    expect(completion.complete).toBe(false);
    expect([...completion.missingPaths]).toEqual(["company.foundedDate"]);
  });

  it("marks a required number outside its configured range as incomplete", () => {
    const page: UiNode = {
      id: "terms",
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
          id: "amount",
          type: "field",
          component: "currencyInput",
          dataPath: "investment.amount",
          constraints: { min: 1 },
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

    expect(evaluatePageCompletion(page, { investment: { amount: -1 } }).complete).toBe(false);
    expect(evaluatePageCompletion(page, { investment: { amount: 1 } }).complete).toBe(true);
  });

  it("validates configured numeric constraints inside collection rows", () => {
    const page = collectionPage(["name", "ownershipPercent"]);
    page.children![0].itemConstraints = { ownershipPercent: { min: 0, max: 100 } };

    const completion = evaluatePageCompletion(page, {
      owners: [{ name: "Avery", ownershipPercent: 120 }],
    });

    expect(completion.complete).toBe(false);
    expect([...completion.missingPaths]).toEqual(["owners.0.ownershipPercent"]);
  });

  it("marks a collection incomplete when its configured numeric total is too high", () => {
    const page = collectionPage(["name", "ownershipPercent"]);
    page.children![0].collectionConstraints = { sum: { field: "ownershipPercent", max: 100 } };

    const completion = evaluatePageCompletion(page, {
      owners: [
        { name: "Avery", ownershipPercent: 60 },
        { name: "Morgan", ownershipPercent: 50 },
      ],
    });

    expect(completion.complete).toBe(false);
    expect([...completion.missingPaths]).toEqual(["owners"]);
  });

  it("marks a required field incomplete when its value is outside the configured options", () => {
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
      children: [{
        id: "companyStage",
        type: "field",
        component: "dropdown",
        dataPath: "company.stage",
        constraints: { allowedValues: ["SEED", "GROWTH"] },
        visible: true,
        enabled: true,
        disabled: false,
        visibleRule: null,
        enabledRule: null,
        required: true,
        requiredRule: null,
      }],
    };

    const completion = evaluatePageCompletion(page, { company: { stage: "UNKNOWN" } });

    expect(completion.complete).toBe(false);
    expect([...completion.missingPaths]).toEqual(["company.stage"]);
  });
});
