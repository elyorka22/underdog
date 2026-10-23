import {
  claimCandidates,
  closePool,
  consumeHelperCommand,
  discoverFromDescriptions,
  enqueueMany,
  finishCandidate,
  finishHelperRun,
  getCandidateStats,
  getSettings,
  hasDatabase,
  isHelperPaused,
  migrate,
  seedDatabase,
  startHelperRun,
  touchHelperHeartbeat,
  upsertCommunity,
  writeHelperEvent,
} from "@underdog/db";
import { runGlobalDiscovery } from "./discover.js";
import { disconnectMtproto, hasMtprotoConfig } from "./mtproto.js";
import { extractUsernames, resolvePublicChat } from "./resolve.js";

const once = process.env.HELPER_ONCE === "1";
const autoSeed = process.env.HELPER_AUTO_SEED !== "0";
const envFallback = {
  batchSize: Number(process.env.HELPER_BATCH_SIZE || 8),
  intervalMs: Number(process.env.HELPER_INTERVAL_MS || 60000),
  delayMs: Number(process.env.HELPER_DELAY_MS || 2000),
  discoverEvery: Number(process.env.HELPER_DISCOVER_EVERY || 1),
  queriesPerTick: Number(process.env.HELPER_QUERIES_PER_TICK || 2),
  autoDiscovery: process.env.HELPER_AUTO_DISCOVERY !== "0",
  maxPendingQueue: Number(process.env.HELPER_MAX_PENDING || 5000),
};

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
  if (/travel|lifestyle|sport|food|kino|mem|ish|job/.test(text)) return "lifestyle";
  return "tech";
}

async function loadRuntimeSettings() {
  try {
    const dbSettings = await getSettings();
    return {
      batchSize: dbSettings.batchSize || envFallback.batchSize,
      intervalMs: dbSettings.intervalMs || envFallback.intervalMs,
      delayMs: dbSettings.delayMs || envFallback.delayMs,
      discoverEvery: dbSettings.discoverEvery || envFallback.discoverEvery,
      queriesPerTick: dbSettings.queriesPerTick || envFallback.queriesPerTick,
      autoDiscovery:
        dbSettings.autoDiscovery != null
          ? dbSettings.autoDiscovery
          : envFallback.autoDiscovery,
      maxPendingQueue:
        dbSettings.maxPendingQueue || envFallback.maxPendingQueue,
    };
  } catch {
    return { ...envFallback };
  }
}

async function processBatch(settings, force = {}) {
  const runId = await startHelperRun();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let discovered = 0;
  let notes = "";

  tick += 1;

  const shouldDiscover =
    hasMtprotoConfig() &&
    settings.autoDiscovery &&
    (force.discover ||
      force.queryId ||
      tick === 1 ||
      tick % Math.max(settings.discoverEvery, 1) === 0);

  if (shouldDiscover) {
    const discovery = await runGlobalDiscovery({
      queriesPerTick: force.queryId ? 1 : settings.queriesPerTick,
      delayMs: Math.max(settings.delayMs, 1500),
      queryId: force.queryId,
    });
    discovered += discovery.enqueued;
    notes += `global:[${discovery.queries.join(", ")}] +${discovery.enqueued}; `;
    await writeHelperEvent("discovery", {
      queries: discovery.queries,
      enqueued: discovery.enqueued,
      note: discovery.note,
    });
    console.log("Global discovery", discovery);
  }

  const candidates = await claimCandidates(settings.batchSize);
  if (!candidates.length && !force.processQueue) {
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
          discoveryQueryId: candidate.query_id || null,
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

    await sleep(settings.delayMs);
  }

  notes += `processed ${processed}`;
  await finishHelperRun(runId, { processed, succeeded, failed, notes });
  await writeHelperEvent("process_batch", {
    processed,
    succeeded,
    failed,
    discovered,
  });
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
    const settings = await loadRuntimeSettings();
    const paused = await isHelperPaused();
    const command = await consumeHelperCommand();

    await touchHelperHeartbeat({
      paused,
      tick,
      command: command || null,
      autoDiscovery: settings.autoDiscovery,
      mtproto: hasMtprotoConfig(),
    });

    if (paused && !command) {
      console.log("Helper paused");
      if (once) break;
      await sleep(Math.min(settings.intervalMs, 15000));
      continue;
    }

    const stats = await getCandidateStats();
    if (stats.pending > settings.maxPendingQueue && !command) {
      console.warn(
        `Pending queue ${stats.pending} exceeds max ${settings.maxPendingQueue}; skipping auto-discovery this tick`,
      );
      settings.autoDiscovery = false;
    }

    /** @type {{ discover?: boolean, processQueue?: boolean, queryId?: number }} */
    const force = {};
    if (command === "discover") force.discover = true;
    if (command === "process_queue") force.processQueue = true;
    if (command && String(command).startsWith("discover_query:")) {
      force.queryId = Number(String(command).split(":")[1]);
      force.discover = true;
    }

    const result = await processBatch(settings, force);
    console.log("Helper tick", result, await getCandidateStats());
    if (once) break;
    await sleep(settings.intervalMs);
  } while (true);

  await disconnectMtproto();
  await closePool();
}

loop().catch(async (error) => {
  console.error("Helper failed:", error);
  try {
    await writeHelperEvent("helper_crash", {
      message: error instanceof Error ? error.message : String(error),
    });
  } catch {
    // ignore
  }
  await disconnectMtproto();
  await closePool();
  process.exit(1);
});
