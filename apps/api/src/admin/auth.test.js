import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  checkLoginRateLimit,
  createSessionToken,
  isAdminAuthConfigured,
  verifyAdminPassword,
  verifySessionToken,
} from "./auth.js";

const KEYS = [
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "ADMIN_TOKEN",
  "COOKIE_SECURE",
  "CORS_ORIGIN",
];

describe("admin auth", () => {
  /** @type {Record<string, string | undefined>} */
  const prev = {};

  beforeEach(() => {
    for (const key of KEYS) prev[key] = process.env[key];
    process.env.ADMIN_PASSWORD = "test-password-123";
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-xyz";
    delete process.env.ADMIN_TOKEN;
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (prev[key] == null) delete process.env[key];
      else process.env[key] = prev[key];
    }
  });

  it("reports configured when password and secret exist", () => {
    assert.equal(isAdminAuthConfigured(), true);
  });

  it("verifies password with timing-safe compare", () => {
    assert.equal(verifyAdminPassword("test-password-123"), true);
    assert.equal(verifyAdminPassword("wrong"), false);
    assert.equal(verifyAdminPassword(""), false);
  });

  it("creates and verifies session tokens", () => {
    const token = createSessionToken();
    assert.equal(verifySessionToken(token), true);
    assert.equal(verifySessionToken("bad.token.value"), false);
    assert.equal(verifySessionToken(""), false);
  });

  it("rate limits repeated login attempts", () => {
    const ip = `test-ip-${Date.now()}`;
    let last = { ok: true };
    for (let i = 0; i < 25; i += 1) {
      last = checkLoginRateLimit(ip);
    }
    assert.equal(last.ok, false);
  });
});
