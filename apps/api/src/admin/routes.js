import { Router } from "express";
import {
  createDiscoveryQuery,
  deleteDiscoveryQuery,
  dismissCandidates,
  enqueueMany,
  getAnalytics,
  getDashboard,
  getDiscoveryQuery,
  getHelperStatus,
  hasDatabase,
  listAdminCandidates,
  listAdminCommunities,
  listAudit,
  listCategories,
  listDiscoveryQueries,
  listHelperRuns,
  listRecentEvents,
  retryCandidates,
  saveSettings,
  getSettings,
  setHelperCommand,
  setHelperPaused,
  updateAdminCommunity,
  updateDiscoveryQuery,
  writeAudit,
} from "@underdog/db";
import {
  checkLoginRateLimit,
  clearSessionCookie,
  createSessionToken,
  isAdminAuthConfigured,
  readSessionFromRequest,
  setSessionCookie,
  verifyAdminPassword,
} from "./auth.js";

export function createAdminRouter() {
  const router = Router();

  router.post("/login", async (req, res) => {
    if (!isAdminAuthConfigured()) {
      res.status(503).json({ error: "Admin auth is not configured" });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress || "";
    const limit = checkLoginRateLimit(ip);
    if (!limit.ok) {
      res.status(429).json({ error: "Too many login attempts" });
      return;
    }
    const password = String(req.body?.password || "");
    if (!verifyAdminPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = createSessionToken();
    setSessionCookie(res, token);
    if (hasDatabase()) {
      await writeAudit({
        action: "login",
        entity: "admin",
        ip,
      });
    }
    res.json({ ok: true });
  });

  router.post("/logout", async (req, res) => {
    clearSessionCookie(res);
    if (hasDatabase() && readSessionFromRequest(req)) {
      await writeAudit({
        action: "logout",
        entity: "admin",
        ip: req.ip || "",
      });
    }
    res.json({ ok: true });
  });

  router.get("/session", (req, res) => {
    res.json({
      authenticated: readSessionFromRequest(req),
      configured: isAdminAuthConfigured(),
      database: hasDatabase(),
    });
  });

  router.use((req, res, next) => {
    if (!readSessionFromRequest(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!hasDatabase()) {
      res.status(503).json({ error: "Database is required for admin" });
      return;
    }
    next();
  });

  router.get("/dashboard", async (req, res) => {
    const range = String(req.query.range || "7d");
    res.json(await getDashboard(["24h", "7d", "30d"].includes(range) ? range : "7d"));
  });

  router.get("/helper/status", async (_req, res) => {
    res.json(await getHelperStatus());
  });

  router.get("/helper/runs", async (req, res) => {
    res.json({ items: await listHelperRuns(Number(req.query.limit) || 30) });
  });

  router.post("/helper/pause", async (req, res) => {
    await setHelperPaused(true);
    await writeAudit({
      action: "helper_pause",
      entity: "helper",
      ip: req.ip || "",
    });
    res.json({ ok: true, paused: true });
  });

  router.post("/helper/resume", async (req, res) => {
    await setHelperPaused(false);
    await writeAudit({
      action: "helper_resume",
      entity: "helper",
      ip: req.ip || "",
    });
    res.json({ ok: true, paused: false });
  });

  router.post("/helper/discover", async (req, res) => {
    await setHelperCommand("discover");
    await writeAudit({
      action: "helper_discover",
      entity: "helper",
      ip: req.ip || "",
    });
    res.json({
      ok: true,
      message: "Discovery requested. Helper will pick it up on next tick.",
    });
  });

  router.post("/helper/process-queue", async (req, res) => {
    await setHelperCommand("process_queue");
    await writeAudit({
      action: "helper_process_queue",
      entity: "helper",
      ip: req.ip || "",
    });
    res.json({
      ok: true,
      message: "Queue processing requested. Helper will pick it up on next tick.",
    });
  });

  router.get("/settings", async (_req, res) => {
    res.json(await getSettings());
  });

  router.put("/settings", async (req, res) => {
    try {
      const next = await saveSettings(req.body || {});
      await writeAudit({
        action: "settings_update",
        entity: "settings",
        meta: { keys: Object.keys(next) },
        ip: req.ip || "",
      });
      res.json(next);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid settings",
      });
    }
  });

  router.get("/queries", async (req, res) => {
    res.json({
      items: await listDiscoveryQueries({
        q: req.query.q,
        language: req.query.language,
        categoryId: req.query.categoryId,
        enabled:
          req.query.enabled == null ? undefined : req.query.enabled === "true",
      }),
    });
  });

  router.post("/queries", async (req, res) => {
    const queryText = String(req.body?.query || "").trim();
    if (queryText.length < 2) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const item = await createDiscoveryQuery(req.body);
    await writeAudit({
      action: "query_create",
      entity: "discovery_query",
      entityId: item.id,
      meta: { query: item.query },
      ip: req.ip || "",
    });
    res.status(201).json(item);
  });

  router.put("/queries/:id", async (req, res) => {
    const id = Number(req.params.id);
    const item = await updateDiscoveryQuery(id, req.body || {});
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await writeAudit({
      action: "query_update",
      entity: "discovery_query",
      entityId: id,
      ip: req.ip || "",
    });
    res.json(item);
  });

  router.delete("/queries/:id", async (req, res) => {
    const id = Number(req.params.id);
    await deleteDiscoveryQuery(id);
    await writeAudit({
      action: "query_delete",
      entity: "discovery_query",
      entityId: id,
      ip: req.ip || "",
    });
    res.json({ ok: true });
  });

  router.post("/queries/:id/run", async (req, res) => {
    const id = Number(req.params.id);
    const item = await getDiscoveryQuery(id);
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await setHelperCommand(`discover_query:${id}`);
    await writeAudit({
      action: "query_run",
      entity: "discovery_query",
      entityId: id,
      meta: { query: item.query },
      ip: req.ip || "",
    });
    res.json({
      ok: true,
      message: "Manual query run requested for next helper tick",
    });
  });

  router.get("/categories", async (_req, res) => {
    res.json({ items: await listCategories() });
  });

  router.get("/candidates", async (req, res) => {
    res.json(
      await listAdminCandidates({
        q: req.query.q,
        status: req.query.status,
        source: req.query.source,
        failedOnly: req.query.failedOnly === "true",
        dismissed: req.query.dismissed === "true" ? true : false,
        limit: req.query.limit,
        offset: req.query.offset,
      }),
    );
  });

  router.post("/candidates/retry", async (req, res) => {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(Number).filter(Boolean)
      : [];
    const count = await retryCandidates(ids);
    await writeAudit({
      action: "candidates_retry",
      entity: "candidates",
      meta: { count, ids },
      ip: req.ip || "",
    });
    res.json({ ok: true, count });
  });

  router.post("/candidates/dismiss", async (req, res) => {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(Number).filter(Boolean)
      : [];
    const count = await dismissCandidates(ids);
    await writeAudit({
      action: "candidates_dismiss",
      entity: "candidates",
      meta: { count, ids },
      ip: req.ip || "",
    });
    res.json({ ok: true, count });
  });

  router.post("/candidates/enqueue", async (req, res) => {
    const usernames = Array.isArray(req.body?.usernames)
      ? req.body.usernames
      : [];
    const added = await enqueueMany(usernames, {
      source: "admin",
      categoryHint: req.body?.categoryId,
    });
    await writeAudit({
      action: "candidates_enqueue",
      entity: "candidates",
      meta: { added, total: usernames.length },
      ip: req.ip || "",
    });
    res.json({ ok: true, added });
  });

  router.get("/communities", async (req, res) => {
    res.json(
      await listAdminCommunities({
        q: req.query.q,
        categoryId: req.query.categoryId,
        type: req.query.type,
        language: req.query.language,
        flagged: req.query.flagged == null ? undefined : req.query.flagged === "true",
        visibility: req.query.visibility,
        limit: req.query.limit,
        offset: req.query.offset,
      }),
    );
  });

  router.get("/communities/export.csv", async (req, res) => {
    const data = await listAdminCommunities({
      q: req.query.q,
      categoryId: req.query.categoryId,
      type: req.query.type,
      language: req.query.language,
      limit: 1000,
      offset: 0,
    });
    const header = "id,username,title,type,category,members,source,createdAt\n";
    const lines = data.items.map((item) =>
      [
        item.id,
        item.username,
        JSON.stringify(item.title),
        item.type,
        item.categoryId,
        item.membersCount,
        item.source,
        item.createdAt,
      ].join(","),
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="underdog-communities.csv"',
    );
    res.send(header + lines.join("\n"));
  });

  router.patch("/communities/:id", async (req, res) => {
    const item = await updateAdminCommunity(req.params.id, req.body || {});
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await writeAudit({
      action: "community_update",
      entity: "community",
      entityId: req.params.id,
      meta: req.body || {},
      ip: req.ip || "",
    });
    res.json(item);
  });

  router.get("/analytics", async (req, res) => {
    const range = String(req.query.range || "7d");
    res.json(await getAnalytics(["24h", "7d", "30d"].includes(range) ? range : "7d"));
  });

  router.get("/health", async (_req, res) => {
    const helper = await getHelperStatus();
    res.json({
      api: { ok: true },
      database: { ok: true },
      helper,
      secretsExposed: false,
    });
  });

  router.get("/events", async (req, res) => {
    res.json({ items: await listRecentEvents(Number(req.query.limit) || 50) });
  });

  router.get("/audit", async (req, res) => {
    res.json({ items: await listAudit({ limit: req.query.limit }) });
  });

  return router;
}
