import cors from "cors";
import express from "express";
import {
  getCommunity,
  getStats,
  listByCategory,
  listCategories,
  listPopular,
  searchCommunities,
} from "@underdog/shared";

const app = express();
const port = Number(process.env.API_PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: corsOrigin.split(",").map((value) => value.trim()),
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "underdog-api" });
});

app.get("/api/stats", (_req, res) => {
  res.json(getStats());
});

app.get("/api/categories", (_req, res) => {
  res.json({ items: listCategories() });
});

app.get("/api/categories/:id", (req, res) => {
  const result = listByCategory(req.params.id, Number(req.query.limit) || 20);
  if (result.total === 0 && !listCategories().some((c) => c.id === req.params.id)) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(result);
});

app.get("/api/search", (req, res) => {
  const result = searchCommunities({
    q: typeof req.query.q === "string" ? req.query.q : "",
    type: typeof req.query.type === "string" ? req.query.type : "all",
    category:
      typeof req.query.category === "string" ? req.query.category : "all",
    sort: typeof req.query.sort === "string" ? req.query.sort : "members",
    limit: Number(req.query.limit) || 20,
    offset: Number(req.query.offset) || 0,
  });
  res.json(result);
});

app.get("/api/popular", (req, res) => {
  res.json(listPopular(Number(req.query.limit) || 8));
});

app.get("/api/communities/:id", (req, res) => {
  const item = getCommunity(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  res.json(item);
});

app.listen(port, () => {
  console.log(`Underdog API listening on http://localhost:${port}`);
});
