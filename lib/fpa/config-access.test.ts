import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCapitalConfigJson } from "./capital-config-access";
import { parseExecutionAnalyticsJson } from "./execution-analytics-access";
import * as demo from "../stratos-demo-data";

describe("capital-config-access", () => {
  it("parses valid capital config JSON", () => {
    const parsed = parseCapitalConfigJson(demo.realOptions, demo.postInvestDeviations);
    assert.equal(parsed.realOptions.length, demo.realOptions.length);
    assert.equal(parsed.postInvestDeviations.length, demo.postInvestDeviations.length);
  });

  it("rejects invalid capital config JSON", () => {
    assert.throws(() => parseCapitalConfigJson(null, []), /格式无效/);
    assert.throws(() => parseCapitalConfigJson([], null), /格式无效/);
  });
});

describe("execution-analytics-access", () => {
  it("parses valid execution analytics JSON", () => {
    const parsed = parseExecutionAnalyticsJson(
      demo.horizonBubbles,
      demo.riceItems,
      demo.trlRadar,
    );
    assert.equal(parsed.horizonBubbles.length, demo.horizonBubbles.length);
    assert.equal(parsed.riceItems.length, demo.riceItems.length);
    assert.equal(parsed.trlRadar.length, demo.trlRadar.length);
  });

  it("rejects invalid execution analytics JSON", () => {
    assert.throws(() => parseExecutionAnalyticsJson({}, [], []), /格式无效/);
  });
});

describe("bsc-config-access", () => {
  it("parses valid BSC cards JSON", async () => {
    const { parseBscCardsJson, mergeBscCardsWithLights } = await import("./bsc-config-access");
    const cards = parseBscCardsJson(demo.bscCards);
    assert.equal(cards.length, 4);
    const merged = mergeBscCardsWithLights(cards, demo.bscLights);
    assert.equal(merged[0]!.light, demo.bscLights.financial);
  });

  it("rejects invalid BSC cards JSON", async () => {
    const { parseBscCardsJson } = await import("./bsc-config-access");
    assert.throws(() => parseBscCardsJson([]), /格式无效/);
  });
});

describe("growth-analytics-access", () => {
  it("parses valid growth analytics JSON", async () => {
    const { parseGrowthAnalyticsJson } = await import("./growth-analytics-access");
    const parsed = parseGrowthAnalyticsJson(demo.aarrrFunnel, demo.kellerBrandLayers);
    assert.equal(parsed.aarrrFunnel.length, demo.aarrrFunnel.length);
    assert.equal(parsed.kellerBrandLayers.length, demo.kellerBrandLayers.length);
  });

  it("rejects invalid growth analytics JSON", async () => {
    const { parseGrowthAnalyticsJson } = await import("./growth-analytics-access");
    assert.throws(() => parseGrowthAnalyticsJson([], null), /格式无效/);
  });
});
