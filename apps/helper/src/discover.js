import {
  enqueueMany,
  getDiscoveryQuery,
  listRunnableQueries,
  query,
  recordQueryRun,
} from "@underdog/db";
import { DISCOVERY_QUERIES } from "./queries.js";
import {
  floodWaitSeconds,
  getMtprotoClient,
  getRecommendations,
  hasMtprotoConfig,
  searchContacts,
  searchGlobalChats,
} from "./mtproto.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getQueryIndex() {
  const result = await query(
    `SELECT value FROM helper_state WHERE key = 'discovery_query_index'`,
  );
  return Number(result.rows[0]?.value || 0);
}

/**
 * @param {number} index
 */
async function setQueryIndex(index) {
  await query(
    `
    INSERT INTO helper_state (key, value, updated_at)
    VALUES ('discovery_query_index', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [String(index)],
  );
}

/**
 * @param {import('teleproto').TelegramClient} tg
 * @param {{ id?: number, query: string, categoryHint?: string, categoryId?: string, synonyms?: string[] }} item
 * @param {number} delayMs
 */
async function runOneQuery(tg, item, delayMs) {
  const variants = [item.query, ...(item.synonyms || [])].filter(Boolean);
  /** @type {Array<{ username: string, type: string }>} */
  const found = [];

  for (const variant of variants.slice(0, 3)) {
    const contacts = await searchContacts(tg, variant, 25);
    found.push(...contacts);
    await sleep(delayMs);

    const channels = await searchGlobalChats(tg, variant, "channel", 25);
    found.push(...channels);
    await sleep(delayMs);

    const groups = await searchGlobalChats(tg, variant, "group", 25);
    found.push(...groups);
    await sleep(delayMs);
  }

  const usernames = [...new Set(found.map((row) => row.username))];
  const categoryHint = item.categoryHint || item.categoryId;
  const added = await enqueueMany(usernames, {
    source: "global_search",
    categoryHint,
    queryId: item.id,
  });

  const channelHit = found.find((row) => row.type === "channel");
  let relatedAdded = 0;
  if (channelHit) {
    const related = await getRecommendations(tg, channelHit.username);
    relatedAdded = await enqueueMany(
      related.map((row) => row.username),
      {
        source: "recommendations",
        categoryHint,
        queryId: item.id,
      },
    );
  }

  if (item.id) {
    await recordQueryRun(item.id, {
      empty: usernames.length === 0,
      candidates: added + relatedAdded,
      communities: 0,
    });
  }

  return {
    query: item.query,
    enqueued: added + relatedAdded,
    found: usernames.length,
  };
}

/**
 * @param {{ queriesPerTick?: number, delayMs?: number, queryId?: number }} [options]
 */
export async function runGlobalDiscovery(options = {}) {
  if (!hasMtprotoConfig()) {
    return {
      enabled: false,
      enqueued: 0,
      queries: [],
      note: "MTProto not configured",
    };
  }

  const queriesPerTick = Math.max(Number(options.queriesPerTick || 2), 1);
  const delayMs = Number(options.delayMs || process.env.HELPER_DELAY_MS || 2000);
  const tg = await getMtprotoClient();

  /** @type {Array<{ id?: number, query: string, categoryHint?: string, categoryId?: string, synonyms?: string[] }>} */
  let queue = [];

  if (options.queryId) {
    const one = await getDiscoveryQuery(Number(options.queryId));
    if (one) {
      queue = [
        {
          id: one.id,
          query: one.query,
          categoryId: one.categoryId || undefined,
          synonyms: one.synonyms,
        },
      ];
    }
  } else {
    const dbQueries = await listRunnableQueries(200);
    if (dbQueries.length) {
      queue = dbQueries.map((item) => ({
        id: item.id,
        query: item.query,
        categoryId: item.categoryId || undefined,
        synonyms: item.synonyms,
      }));
    } else {
      queue = DISCOVERY_QUERIES.map((item) => ({
        query: item.q,
        categoryHint: item.categoryHint,
      }));
    }
  }

  if (!queue.length) {
    return {
      enabled: true,
      enqueued: 0,
      queries: [],
      note: "no runnable queries",
    };
  }

  let index = options.queryId ? 0 : await getQueryIndex();
  let enqueued = 0;
  /** @type {string[]} */
  const used = [];

  for (let step = 0; step < Math.min(queriesPerTick, queue.length); step += 1) {
    const item = queue[index % queue.length];
    index = (index + 1) % queue.length;
    used.push(item.query);

    try {
      const result = await runOneQuery(tg, item, delayMs);
      enqueued += result.enqueued;
    } catch (error) {
      const wait = floodWaitSeconds(error);
      if (item.id) {
        await recordQueryRun(item.id, {
          empty: true,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      if (wait > 0) {
        console.warn(`Discovery flood wait ${wait}s on query "${item.query}"`);
        await sleep(wait * 1000);
      } else {
        console.warn(
          `Discovery query failed "${item.query}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    await sleep(delayMs);
  }

  if (!options.queryId) {
    await setQueryIndex(index);
  }

  return {
    enabled: true,
    enqueued,
    queries: used,
    note: "ok",
  };
}
