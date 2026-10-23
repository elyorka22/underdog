import { enqueueMany, query } from "@underdog/db";
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
 * Run one discovery round: pick next keywords and search Telegram globally.
 * @param {{ queriesPerTick?: number, delayMs?: number }} [options]
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

  let index = await getQueryIndex();
  let enqueued = 0;
  /** @type {string[]} */
  const used = [];

  for (let step = 0; step < queriesPerTick; step += 1) {
    const item = DISCOVERY_QUERIES[index % DISCOVERY_QUERIES.length];
    index = (index + 1) % DISCOVERY_QUERIES.length;
    used.push(item.q);

    try {
      const found = [];

      const contacts = await searchContacts(tg, item.q, 25);
      found.push(...contacts);
      await sleep(delayMs);

      const channels = await searchGlobalChats(tg, item.q, "channel", 25);
      found.push(...channels);
      await sleep(delayMs);

      const groups = await searchGlobalChats(tg, item.q, "group", 25);
      found.push(...groups);

      const usernames = [...new Set(found.map((row) => row.username))];
      const added = await enqueueMany(usernames, {
        source: "global_search",
        categoryHint: item.categoryHint,
      });
      enqueued += added;

      // Soft enrichment: recommendations from first channel hit
      const channelHit = found.find((row) => row.type === "channel");
      if (channelHit) {
        await sleep(delayMs);
        const related = await getRecommendations(tg, channelHit.username);
        const relatedNames = related.map((row) => row.username);
        enqueued += await enqueueMany(relatedNames, {
          source: "recommendations",
          categoryHint: item.categoryHint,
        });
      }
    } catch (error) {
      const wait = floodWaitSeconds(error);
      if (wait > 0) {
        console.warn(`Discovery flood wait ${wait}s on query "${item.q}"`);
        await sleep(wait * 1000);
      } else {
        console.warn(
          `Discovery query failed "${item.q}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    await sleep(delayMs);
  }

  await setQueryIndex(index);

  return {
    enabled: true,
    enqueued,
    queries: used,
    note: "ok",
  };
}
