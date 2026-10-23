import { Api, TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";

/** @type {TelegramClient | null} */
let client = null;

export function hasMtprotoConfig() {
  return Boolean(
    process.env.TELEGRAM_API_ID &&
      process.env.TELEGRAM_API_HASH &&
      process.env.TELEGRAM_SESSION,
  );
}

export async function getMtprotoClient() {
  if (!hasMtprotoConfig()) {
    throw new Error(
      "TELEGRAM_API_ID, TELEGRAM_API_HASH and TELEGRAM_SESSION are required",
    );
  }

  if (client) return client;

  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = String(process.env.TELEGRAM_API_HASH);
  const session = new StringSession(String(process.env.TELEGRAM_SESSION));

  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: true,
  });

  await client.connect();
  if (!(await client.checkAuthorization())) {
    throw new Error(
      "TELEGRAM_SESSION is invalid. Run: npm run login -w @underdog/helper",
    );
  }

  return client;
}

export async function disconnectMtproto() {
  if (client) {
    await client.disconnect();
    client = null;
  }
}

/**
 * @param {unknown} error
 */
export function floodWaitSeconds(error) {
  const seconds = Number(error?.seconds || error?.errorMessage?.match?.(/(\d+)/)?.[1] || 0);
  if (error?.errorMessage?.includes?.("FLOOD") || error?.code === 420) {
    return Math.max(seconds, 5);
  }
  return 0;
}

/**
 * @param {import('teleproto').TelegramClient} tg
 * @param {string} query
 * @param {number} [limit]
 */
export async function searchContacts(tg, query, limit = 20) {
  const result = await tg.invoke(
    new Api.contacts.Search({
      q: query,
      limit,
    }),
  );
  return collectPublicChats(result.chats || []);
}

/**
 * @param {import('teleproto').TelegramClient} tg
 * @param {string} query
 * @param {'channel' | 'group' | 'all'} [mode]
 * @param {number} [limit]
 */
export async function searchGlobalChats(tg, query, mode = "all", limit = 20) {
  const result = await tg.invoke(
    new Api.messages.SearchGlobal({
      q: query,
      filter: new Api.InputMessagesFilterEmpty(),
      minDate: 0,
      maxDate: 0,
      offsetRate: 0,
      offsetPeer: new Api.InputPeerEmpty(),
      offsetId: 0,
      limit,
      broadcastsOnly: mode === "channel" ? true : undefined,
      groupsOnly: mode === "group" ? true : undefined,
    }),
  );
  return collectPublicChats(result.chats || []);
}

/**
 * @param {import('teleproto').TelegramClient} tg
 * @param {string} username
 */
export async function getRecommendations(tg, username) {
  try {
    const entity = await tg.getEntity(username);
    if (!entity || !("broadcast" in entity || entity.className === "Channel")) {
      return [];
    }
    const input = await tg.getInputEntity(entity);
    const result = await tg.invoke(
      new Api.channels.GetChannelRecommendations({
        channel: input,
      }),
    );
    return collectPublicChats(result.chats || []);
  } catch {
    return [];
  }
}

/**
 * @param {any[]} chats
 */
function collectPublicChats(chats) {
  /** @type {Array<{ username: string, title: string, type: 'channel' | 'group', membersCount: number, telegramId: number|null, description: string }>} */
  const items = [];

  for (const chat of chats) {
    const className = chat?.className || chat?.constructor?.name || "";
    const username = chat?.username ? String(chat.username).toLowerCase() : "";
    if (!username) continue;

    let type = null;
    if (className === "Channel" || chat.broadcast || chat.megagroup) {
      type = chat.megagroup && !chat.broadcast ? "group" : chat.broadcast ? "channel" : "group";
      if (chat.broadcast) type = "channel";
      if (chat.megagroup) type = "group";
    } else if (className === "Chat") {
      // basic groups often have no username; skip if no username already handled
      type = "group";
    } else {
      continue;
    }

    items.push({
      username,
      title: String(chat.title || username),
      type,
      membersCount: Number(chat.participantsCount || 0),
      telegramId: chat.id ? Number(chat.id) : null,
      description: "",
    });
  }

  return items;
}
