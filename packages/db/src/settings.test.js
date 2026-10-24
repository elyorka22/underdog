import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, validateSettings } from "./settings.js";

describe("admin settings validation", () => {
  it("returns defaults for empty input", () => {
    const next = validateSettings({});
    assert.equal(next.batchSize, DEFAULT_SETTINGS.batchSize);
    assert.equal(next.autoDiscovery, true);
  });

  it("accepts valid bounds", () => {
    const next = validateSettings({
      batchSize: 12,
      intervalMs: 30000,
      delayMs: 1500,
      concurrency: 4,
      discoverEvery: 2,
      queriesPerTick: 3,
      maxPendingQueue: 1000,
      drainPendingThreshold: 200,
      autoDiscovery: false,
    });
    assert.equal(next.batchSize, 12);
    assert.equal(next.concurrency, 4);
    assert.equal(next.autoDiscovery, false);
  });

  it("rejects out-of-range batch size", () => {
    assert.throws(() => validateSettings({ batchSize: 999 }), /batchSize/);
  });

  it("rejects invalid interval", () => {
    assert.throws(() => validateSettings({ intervalMs: 100 }), /intervalMs/);
  });

  it("accepts turbo-like batch and delay", () => {
    const next = validateSettings({
      batchSize: 40,
      delayMs: 250,
      concurrency: 5,
      intervalMs: 8000,
    });
    assert.equal(next.batchSize, 40);
    assert.equal(next.delayMs, 250);
    assert.equal(next.concurrency, 5);
  });
});
