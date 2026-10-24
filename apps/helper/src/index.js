import { detectLanguage } from "@underdog/shared";
import {
  claimCandidates,
  closePool,
  consumeHelperCommand,
  discoverFromDescriptions,
  enqueueMany,
  finishCandidate,
  finishHelperRun,
  getCandidateStats,
  getDiscoveryQuery,
  getHelperFocus,
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
  concurrency: Number(process.env.HELPER_CONCURRENCY || 3),
  discoverEvery: Number(process.env.HELPER_DISCOVER_EVERY || 1),
  queriesPerTick: Number(process.env.HELPER_QUERIES_PER_TICK || 2),
  autoDiscovery: process.env.HELPER_AUTO_DISCOVERY !== "0",
  maxPendingQueue: Number(process.env.HELPER_MAX_PENDING || 5000),
  drainPendingThreshold: Number(process.env.HELPER_DRAIN_THRESHOLD || 150),
};

let tick = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run async work over items with limited parallelism.
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<void>} worker
 */
async function mapPool(items, concurrency, worker) {
  const limit = Math.max(1, Math.min(concurrency || 1, items.length || 1));
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
}

function guessCategory(description, hint) {
  if (hint) return hint;
  const text = (description || "").toLowerCase();
  if (/ai|chatgpt|llm|нейро|sun.?iy intellekt/.test(text)) return "ai";
  if (/crypto|bitcoin|trading|блокчейн|крипт/.test(text)) return "crypto";
  if (/invest|акци|fond|portfel|инвест/.test(text)) return "investing";
  if (/vacanc|vakansi|job|ish e.?lon|работа|remote/.test(text)) return "jobs";
  if (/freelance|фриланс|upwork|kwork/.test(text)) return "freelance";
  if (/startup|startap|mvp/.test(text)) return "startups";
  if (/business|biznes|tadbirkor|бизнес/.test(text)) return "business";
  if (/devops|docker|kubernetes|ci\/cd/.test(text)) return "devops";
  if (/security|kiber|хакер|pentest/.test(text)) return "cybersecurity";
  if (/data science|analitik|sql|bi\b|дата/.test(text)) return "data";
  if (/android|ios|flutter|mobil/.test(text)) return "mobile";
  if (/design|dizayn|ui|ux|фигма/.test(text)) return "design";
  if (/photo|foto|фото/.test(text)) return "photography";
  if (/video|монтаж|youtube|reels/.test(text)) return "video";
  if (/market|smm|reklama|ads|таргет/.test(text)) return "marketing";
  if (/sales|sotuv|продаж/.test(text)) return "sales";
  if (/hr\b|career|kariyer|резюме/.test(text)) return "hr";
  if (/ielts|til o.?rgan|language|английск|русский язык/.test(text))
    return "languages";
  if (/student|talaba|universitet|grant/.test(text)) return "students";
  if (/edu|ta.?lim|course|kurs|o.?quv/.test(text)) return "education";
  if (/bola|kids|детск/.test(text)) return "kids";
  if (/ota.?ona|parent|мам[аы]|пап/.test(text)) return "parenting";
  if (/salomat|health|tibbiy|медицин|врач/.test(text)) return "health";
  if (/fitness|fitnes|спортзал|workout/.test(text)) return "fitness";
  if (/football|futbol|soccer|футбол/.test(text)) return "football";
  if (/food|ovqat|retsept|рецепт|еда/.test(text)) return "food";
  if (/travel|sayohat|туризм|viza/.test(text)) return "travel";
  if (/avto|mashina|car|авто/.test(text)) return "cars";
  if (/uy[- ]?joy|kvartira|ijara|недвиж/.test(text)) return "realestate";
  if (/chegirma|skidka|shop|xarid|скидк/.test(text)) return "shopping";
  if (/moda|fashion|одежд/.test(text)) return "fashion";
  if (/beauty|go.?zallik|makeup|космет/.test(text)) return "beauty";
  if (/music|musiqa|музык/.test(text)) return "music";
  if (/kino|serial|movie|фильм/.test(text)) return "movies";
  if (/kitob|book|книг/.test(text)) return "books";
  if (/science|fan\b|наук/.test(text)) return "science";
  if (/psixolog|psycholog/.test(text)) return "psychology";
  if (/huquq|law|юрист|закон/.test(text)) return "law";
  if (/news|yangilik|новост/.test(text)) return "news";
  if (/blog|media|журнал/.test(text)) return "media";
  if (/game|o.?yin|esport|dota|pubg/.test(text)) return "games";
  if (/meme|memlar|hazil|юмор|прикол/.test(text)) return "memes";
  if (/hayvon|animal|кот|собак|it\b/.test(text)) return "animals";
  if (/tabiat|nature|эколог/.test(text)) return "nature";
  if (/din\b|islam|namoz|религ/.test(text)) return "religion";
  if (/dating|tanishuv|знакомств|знакомства/.test(text)) return "dating";
  if (/anonim|anonymous|confession/.test(text)) return "anonymous";
  if (/oldi.?sotdi|buy.?sell|barter|купл.?прода/.test(text)) return "buy_sell";
  if (/munosabat|relationship/.test(text)) return "relationships";
  if (/toshkent|tashkent/.test(text)) return "tashkent";
  if (/viloyat|samarqand|buxoro|andijon|region/.test(text)) return "regions";
  if (/ai bot|chatgpt bot|gemini bot/.test(text)) return "ai_bots";
  if (/music bot|musiqa bot/.test(text)) return "music_bots";
  if (/download bot|yuklab|скачать бот/.test(text)) return "download_bots";
  if (/moderat|anti.?spam|admin bot/.test(text)) return "moderation_bots";
  if (/translate bot|tarjima bot/.test(text)) return "translate_bots";
  if (/sticker bot/.test(text)) return "sticker_bots";
  if (/search bot|qidiruv bot/.test(text)) return "search_bots";
  if (/payment bot|to.?lov bot|shop bot/.test(text)) return "payment_bots";
  if (/game bot|o.?yin bot|quiz bot/.test(text)) return "game_bots";
  if (/utility bot|foydali bot|helper bot/.test(text)) return "utility_bots";
  if (/telegram bot|sticker|kanal marketing/.test(text)) return "telegram";
  if (/lifestyle|hayot tarzi|hobbi/.test(text)) return "lifestyle";
  if (/python|javascript|react|dastur|программ|coding/.test(text)) return "tech";
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
      concurrency: dbSettings.concurrency || envFallback.concurrency,
      autoDiscovery:
        dbSettings.autoDiscovery != null
          ? dbSettings.autoDiscovery
          : envFallback.autoDiscovery,
      maxPendingQueue:
        dbSettings.maxPendingQueue || envFallback.maxPendingQueue,
      drainPendingThreshold:
        dbSettings.drainPendingThreshold || envFallback.drainPendingThreshold,
    };
  } catch {
    return { ...envFallback };
  }
}

/**
 * @param {object} candidate
 * @param {{ focusActive: boolean, focus: object|null, draining: boolean }} ctx
 */
async function processOneCandidate(candidate, ctx) {
  const resolved = await resolvePublicChat(candidate.username);
  if (!resolved) {
    await finishCandidate(candidate.id, "failed", "not found or private");
    return { ok: false };
  }
  if (resolved.skipped) {
    await finishCandidate(candidate.id, "skipped", resolved.reason);
    return { ok: false };
  }

  let language = null;
  if (candidate.query_id) {
    const dq = await getDiscoveryQuery(Number(candidate.query_id));
    language = dq?.language || null;
  }
  if (!language) {
    language = detectLanguage(
      `${resolved.title || ""} ${resolved.description || ""}`,
    );
  }

  const categoryId = guessCategory(
    resolved.description,
    candidate.category_hint ||
      (ctx.focusActive ? ctx.focus?.categoryId : null),
  );

  await upsertCommunity({
    username: resolved.username,
    title: resolved.title,
    description: resolved.description,
    type: resolved.type,
    categoryId,
    language,
    membersCount: resolved.membersCount,
    tags: [],
    verified: resolved.verified,
    telegramId: resolved.telegramId,
    status: "active",
    source: resolved.source,
    discoveryQueryId: candidate.query_id || null,
  });

  // While draining a backlog, skip mention fan-out (it grows the queue again).
  if (!ctx.draining) {
    const mentions = extractUsernames(resolved.description);
    if (mentions.length) {
      await enqueueMany(mentions, { source: "mention" });
    }
  }

  await finishCandidate(candidate.id, "done");
  return { ok: true };
}

async function processBatch(settings, force = {}) {
  const runId = await startHelperRun();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let discovered = 0;
  let notes = "";

  tick += 1;

  const focus = force.focus || (await getHelperFocus());
  const focusActive = Boolean(focus?.categoryId);
  const pendingBefore = Number(force.pendingCount || 0);
  const drainThreshold = Math.max(
    Number(settings.drainPendingThreshold || 150),
    20,
  );
  const draining =
    Boolean(force.draining) ||
    (!focusActive &&
      !force.discover &&
      !force.queryId &&
      pendingBefore >= drainThreshold);

  const shouldDiscover =
    hasMtprotoConfig() &&
    !draining &&
    (focusActive ||
      (settings.autoDiscovery &&
        (force.discover ||
          force.queryId ||
          tick === 1 ||
          tick % Math.max(settings.discoverEvery, 1) === 0)));

  if (shouldDiscover) {
    const discovery = await runGlobalDiscovery({
      queriesPerTick: force.queryId ? 1 : settings.queriesPerTick,
      delayMs: Math.max(settings.delayMs, 800),
      queryId: force.queryId,
      focusCategoryId: focusActive ? focus.categoryId : undefined,
      focusType: focusActive ? focus.type || "all" : "all",
    });
    discovered += discovery.enqueued;
    if (focusActive) {
      notes += `focus:${focus.categoryId}/${focus.type} ${Math.ceil((focus.remainingMs || 0) / 60000)}m; `;
    }
    notes += `global:[${discovery.queries.join(", ")}] +${discovery.enqueued}; `;
    await writeHelperEvent("discovery", {
      queries: discovery.queries,
      enqueued: discovery.enqueued,
      note: discovery.note,
      focus: discovery.focus,
    });
    console.log("Global discovery", discovery);
  } else if (draining) {
    notes += `drain:pending=${pendingBefore}; `;
  }

  const batchSize = draining
    ? Math.max(settings.batchSize, 20)
    : settings.batchSize;
  const concurrency = draining
    ? Math.max(settings.concurrency || 3, 4)
    : Math.max(settings.concurrency || 1, 1);
  const itemDelay = draining
    ? Math.min(settings.delayMs, 300)
    : settings.delayMs;

  const candidates = await claimCandidates(batchSize);
  if (!candidates.length && !force.processQueue) {
    const fromMentions = draining ? 0 : await discoverFromDescriptions(40);
    discovered += fromMentions;
    notes += draining
      ? "queue empty while draining"
      : `queue empty; mentions +${fromMentions}`;
    await finishHelperRun(runId, {
      processed: 0,
      succeeded: 0,
      failed: 0,
      notes,
    });
    return { processed, succeeded, failed, discovered, draining };
  }

  await mapPool(candidates, concurrency, async (candidate) => {
    processed += 1;
    try {
      const result = await processOneCandidate(candidate, {
        focusActive,
        focus,
        draining,
      });
      if (result.ok) succeeded += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      await finishCandidate(
        candidate.id,
        "failed",
        error instanceof Error ? error.message : String(error),
      );
    }
    if (itemDelay > 0) await sleep(itemDelay);
  });

  notes += `processed ${processed} x${concurrency}`;
  await finishHelperRun(runId, { processed, succeeded, failed, notes });
  await writeHelperEvent("process_batch", {
    processed,
    succeeded,
    failed,
    discovered,
    concurrency,
    draining,
  });
  return { processed, succeeded, failed, discovered, draining };
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
    const focus = await getHelperFocus();

    await touchHelperHeartbeat({
      paused,
      tick,
      command: command || null,
      autoDiscovery: settings.autoDiscovery,
      mtproto: hasMtprotoConfig(),
      focus: focus
        ? {
            categoryId: focus.categoryId,
            type: focus.type,
            until: focus.until,
            remainingMs: focus.remainingMs,
          }
        : null,
    });

    if (paused && !command) {
      console.log("Helper paused");
      if (once) break;
      await sleep(Math.min(settings.intervalMs, 15000));
      continue;
    }

    const stats = await getCandidateStats();
    const drainThreshold = Math.max(settings.drainPendingThreshold || 150, 20);
    const draining =
      !focus &&
      !command?.startsWith?.("discover") &&
      stats.pending >= drainThreshold;

    if (
      (stats.pending > settings.maxPendingQueue || draining) &&
      !command &&
      !focus
    ) {
      if (stats.pending > settings.maxPendingQueue) {
        console.warn(
          `Pending queue ${stats.pending} exceeds max ${settings.maxPendingQueue}; skipping auto-discovery this tick`,
        );
      } else {
        console.log(
          `Drain mode: pending=${stats.pending} >= ${drainThreshold}; focusing on queue`,
        );
      }
      settings.autoDiscovery = false;
    }

    /** @type {{ discover?: boolean, processQueue?: boolean, queryId?: number, focus?: object, pendingCount?: number, draining?: boolean }} */
    const force = {
      focus: focus || undefined,
      pendingCount: stats.pending,
      draining,
    };
    if (command === "discover") force.discover = true;
    if (command === "process_queue") force.processQueue = true;
    if (command && String(command).startsWith("discover_query:")) {
      force.queryId = Number(String(command).split(":")[1]);
      force.discover = true;
    }

    if (focus) {
      console.log(
        `Helper focus active: ${focus.categoryId}/${focus.type} ~${Math.ceil(focus.remainingMs / 60000)}m left`,
      );
    }

    const result = await processBatch(settings, force);
    console.log("Helper tick", result, await getCandidateStats());
    if (once) break;
    const nextSleep = result.draining
      ? Math.min(settings.intervalMs, 10000)
      : settings.intervalMs;
    await sleep(nextSleep);
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
