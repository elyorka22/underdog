import cors from "cors";
import express from "express";
import {
  enqueueMany,
  getCandidateStats,
  hasDatabase,
  migrate,
  seedDatabase,
} from "@underdog/db";
import { createAdminRouter } from "./admin/routes.js";
import {
  getCommunity,
  getStats,
  listByCategory,
  listCategories,
  listPopular,
  searchCommunities,
  usingDatabase,
} from "./catalog.js";

const app = express();
const port = Number(process.env.API_PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const adminToken = process.env.ADMIN_TOKEN || "";

app.set("trust proxy", 1);
app.use(
  cors({
    origin: corsOrigin.split(",").map((value) => value.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

function requireAdminToken(req, res, next) {
  if (!adminToken) {
    res.status(503).json({ error: "ADMIN_TOKEN is not configured" });
    return;
  }
  const header = req.header("x-admin-token") || "";
  if (header !== adminToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "underdog-api",
    database: usingDatabase(),
  });
});

app.get("/api/stats", async (_req, res) => {
  res.json(await getStats());
});

app.get("/api/categories", async (_req, res) => {
  res.json({ items: await listCategories() });
});

app.get("/api/categories/:id", async (req, res) => {
  const categories = await listCategories();
  const result = await listByCategory(
    req.params.id,
    Number(req.query.limit) || 20,
  );
  if (result.total === 0 && !categories.some((c) => c.id === req.params.id)) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(result);
});

app.get("/api/search", async (req, res) => {
  const result = await searchCommunities({
    q: typeof req.query.q === "string" ? req.query.q : "",
    type: typeof req.query.type === "string" ? req.query.type : "all",
    category:
      typeof req.query.category === "string" ? req.query.category : "all",
    language:
      typeof req.query.language === "string" ? req.query.language : "all",
    sort: typeof req.query.sort === "string" ? req.query.sort : "members",
    limit: Number(req.query.limit) || 20,
    offset: Number(req.query.offset) || 0,
  });
  res.json(result);
});

app.get("/api/popular", async (req, res) => {
  res.json(await listPopular(Number(req.query.limit) || 8));
});

app.get("/api/communities/:id", async (req, res) => {
  const item = await getCommunity(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  res.json(item);
});

app.get("/api/helper/stats", requireAdminToken, async (_req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }
  res.json(await getCandidateStats());
});

app.post("/api/helper/candidates", requireAdminToken, async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const usernames = Array.isArray(req.body?.usernames)
    ? req.body.usernames
    : typeof req.body?.username === "string"
      ? [req.body.username]
      : [];

  if (!usernames.length) {
    res.status(400).json({ error: "usernames required" });
    return;
  }

  const added = await enqueueMany(usernames, {
    source: "api",
    categoryHint:
      typeof req.body?.categoryId === "string" ? req.body.categoryId : undefined,
  });

  res.json({ added, total: usernames.length });
});

app.use("/api/admin", createAdminRouter());

async function boot() {
  if (hasDatabase()) {
    await migrate();
    if (process.env.API_AUTO_SEED === "1") {
      await seedDatabase();
      console.log("Database seeded from API boot");
    }
    console.log("API using PostgreSQL");
  } else {
    console.log("API using in-memory seed (no DATABASE_URL)");
  }

  app.listen(port, () => {
    console.log(`Underdog API listening on http://localhost:${port}`);
  });
}

boot().catch((error) => {
  console.error("API failed to start:", error);
  process.exit(1);
});
