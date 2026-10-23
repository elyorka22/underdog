import {
  claimCandidates,
  closePool,
  discoverFromDescriptions,
  enqueueMany,
  finishCandidate,
  finishHelperRun,
  getCandidateStats,
  hasDatabase,
  migrate,
  seedDatabase,
  startHelperRun,
  upsertCommunity,
} from "@underdog/db";
import { runGlobalDiscovery } from "./discover.js";
import { disconnectMtproto, hasMtprotoConfig } from "./mtproto.js";
import { extractUsernames, resolvePublicChat } from "./resolve.js";

const batchSize = Number(process.env.HELPER_BATCH_SIZE || 8);
const intervalMs = Number(process.env.HELPER_INTERVAL_MS || 60000);
const delayMs = Number(process.env.HELPER_DELAY_MS || 1500);
const discoverEvery = Number(process.env.HELPER_DISCOVER_EVERY || 1);
const queriesPerTick = Number(process.env.HELPER_QUERIES_PER_TICK || 2);
const once = process.env.HELPER_ONCE === "1";
const autoSeed = process.env.HELPER_AUTO_SEED !== "0";

let tick = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function guessCategory(description, hint) {
  if (hint) return hint;
  const text = (description || "").toLowerCase();
  if (/crypto|bitcoin|trading|moliya|финанс/.test(text)) return "crypto";
  if (/design|dizayn|ui|ux/.test(text)) return "design";
  if (/market|smm|reklama|ads/.test(text)) return "marketing";
  if (/edu|ta'?lim|course|kurs|english|python/.test(text)) return "education";
  if (/news|yangilik|новост/.test(text)) return "news";
  if (/game|o'?yin|esport|dota/.test(text)) return "games";
  if (/travel|lifestyle|sport|food|kino|mem/.test(text)) return "lifestyle";
  return "tech";
}

async function processBatch() {
  const runId = await startHelperRun();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let discovered = 0;
  /** @type {string} */
  let notes = "";

  tick += 1;
  const shouldDiscover =
    hasMtprotoConfig() && (tick === 1 || tick % Math.max(discoverEvery, 1) === 0);

  if (shouldDiscover) {
    const discovery = await runGlobalDiscovery({
      queriesPerTick,
      delayMs: Math.max(delayMs, 2000),
    });
    discovered += discovery.enqueued;
    notes += `global:[${discovery.queries.join(", ")}] +${discovery.enqueued}; `;
    console.log("Global discovery", discovery);
  }

  const candidates = await claimCandidates(batchSize);
  if (!candidates.length) {
    const fromMentions = await discoverFromDescriptions(40);
    discovered += fromMentions;
    notes += `queue empty; mentions +${fromMentions}`;
    await finishHelperRun(runId, {
      processed: 0,
      succeeded: 0,
      failed: 0,
      notes,
    });
    return { processed, succeeded, failed, discovered };
  }

  for (const candidate of candidates) {
    processed += 1;
    try {
      const resolved = await resolvePublicChat(candidate.username);
      if (!resolved) {
        failed += 1;
        await finishCandidate(candidate.id, "failed", "not found or private");
      } else if (resolved.skipped) {
        failed += 1;
        await finishCandidate(candidate.id, "skipped", resolved.reason);
      } else {
        await upsertCommunity({
          username: resolved.username,
          title: resolved.title,
          description: resolved.description,
          type: resolved.type,
          categoryId: guessCategory(
            resolved.description,
            candidate.category_hint,
          ),
          membersCount: resolved.membersCount,
          tags: [],
          verified: resolved.verified,
          telegramId: resolved.telegramId,
          status: "active",
          source: resolved.source,
        });

        const mentions = extractUsernames(resolved.description);
        if (mentions.length) {
          await enqueueMany(mentions, { source: "mention" });
        }

        succeeded += 1;
        await finishCandidate(candidate.id, "done");
      }
    } catch (error) {
      failed += 1;
      await finishCandidate(
        candidate.id,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
    }

    await sleep(delayMs);
  }

  notes += `processed ${processed}`;
  await finishHelperRun(runId, { processed, succeeded, failed, notes });
  return { processed, succeeded, failed, discovered };
}

async function bootstrap() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required for helper");
  }

  await migrate();
  if (autoSeed) {
    await seedDatabase();
  }

  const extra = (process.env.HELPER_SEED_USERNAMES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (extra.length) {
    const added = await enqueueMany(extra, { source: "env" });
    console.log(`Enqueued ${added} usernames from HELPER_SEED_USERNAMES`);
  }

  if (hasMtprotoConfig()) {
    console.log("Global MTProto discovery: ENABLED");
  } else {
    console.warn(
      "Global MTProto discovery: DISABLED (set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION)",
    );
  }

  console.log("Helper ready", await getCandidateStats());
}

async function loop() {
  await bootstrap();

  do {
    const result = await processBatch();
    console.log("Helper tick", result, await getCandidateStats());
    if (once) break;
    await sleep(intervalMs);
  } while (true);

  await disconnectMtproto();
  await closePool();
}

loop().catch(async (error) => {
  console.error("Helper failed:", error);
  await disconnectMtproto();
  await closePool();
  process.exit(1);
});
