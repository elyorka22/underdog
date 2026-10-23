import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const COOKIE_NAME = "ud_admin_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

/** @type {Map<string, { count: number, resetAt: number }>} */
const loginAttempts = new Map();

function sessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_TOKEN ||
    ""
  );
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "";
}

export function isAdminAuthConfigured() {
  return Boolean(adminPassword() && sessionSecret());
}

/**
 * @param {string} ip
 */
export function checkLoginRateLimit(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const row = loginAttempts.get(key);
  if (!row || row.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { ok: true, remaining: 19 };
  }
  if (row.count >= 20) {
    return { ok: false, remaining: 0, retryAfterMs: row.resetAt - now };
  }
  row.count += 1;
  return { ok: true, remaining: 20 - row.count };
}

/**
 * @param {string} password
 */
export function verifyAdminPassword(password) {
  const expected = adminPassword();
  if (!expected || !password) return false;
  const a = Buffer.from(String(password));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken() {
  const payload = `${Date.now()}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * @param {string} token
 */
export function verifySessionToken(token) {
  if (!token || !sessionSecret()) return false;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  const provided = parts[2];
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const created = Number(parts[0]);
  if (!Number.isFinite(created)) return false;
  if (Date.now() - created > MAX_AGE_MS) return false;
  return true;
}

/**
 * @param {import('express').Request} req
 */
export function readSessionFromRequest(req) {
  const header = req.header("x-admin-token");
  if (header && adminPassword() && header === adminPassword()) {
    return true;
  }
  const cookie = req.headers.cookie || "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const token = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  return verifySessionToken(token);
}

/**
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setSessionCookie(res, token) {
  // Only set Secure when explicitly enabled or the public site is HTTPS.
  // Droplet HTTP (IP:3000) must keep cookies non-Secure or login breaks.
  const secure =
    process.env.COOKIE_SECURE === "1" ||
    String(process.env.CORS_ORIGIN || "").startsWith("https://");
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`,
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

/**
 * @param {import('express').Response} res
 */
export function clearSessionCookie(res) {
  res.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  );
}

export { COOKIE_NAME };
