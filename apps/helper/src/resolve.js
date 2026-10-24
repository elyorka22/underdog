/**
 * Resolve public Telegram channel/group/bot metadata.
 * Prefers Bot API when BOT_TOKEN is set, otherwise parses t.me preview HTML.
 */

/**
 * @param {string} username
 */
export async function resolvePublicChat(username) {
  const clean = username.replace(/^@/, "").toLowerCase();
  const token = process.env.BOT_TOKEN || "";

  if (token) {
    const viaBot = await resolveViaBotApi(clean, token);
    if (viaBot) return viaBot;
  }

  return resolveViaTelegramPage(clean);
}

/**
 * @param {string} username
 * @param {string} token
 */
async function resolveViaBotApi(username, token) {
  const chat = await telegramApi(token, "getChat", { chat_id: `@${username}` });
  if (!chat?.ok || !chat.result) return null;

  const info = chat.result;
  let membersCount = 0;
  try {
    const count = await telegramApi(token, "getChatMemberCount", {
      chat_id: `@${username}`,
    });
    if (count?.ok) membersCount = Number(count.result || 0);
  } catch {
    membersCount = 0;
  }

  const looksBot =
    info.type === "private" ||
    Boolean(info.is_bot) ||
    /bot$/i.test(info.username || username);

  const type =
    info.type === "channel"
      ? "channel"
      : info.type === "group" || info.type === "supergroup"
        ? "group"
        : looksBot
          ? "bot"
          : null;

  if (!type) {
    return { skipped: true, reason: `unsupported chat type: ${info.type}` };
  }

  return {
    username: (info.username || username).toLowerCase(),
    title: info.title || info.first_name || username,
    description: info.description || info.bio || "",
    type,
    membersCount,
    telegramId: info.id || null,
    verified: false,
    source: "bot_api",
  };
}

/**
 * @param {string} token
 * @param {string} method
 * @param {Record<string, string>} params
 */
async function telegramApi(token, method, params) {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * @param {string} username
 */
async function resolveViaTelegramPage(username) {
  const urls = [
    `https://t.me/${username}`,
    `https://t.me/s/${username}`,
  ];

  for (const pageUrl of urls) {
    try {
      const response = await fetch(pageUrl, {
        headers: {
          "User-Agent":
            "UnderDogHelper/0.1 (+https://github.com/elyorka22/underdog; public catalog indexer)",
          Accept: "text/html",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) continue;
      const html = await response.text();
      const parsed = parseTelegramHtml(html, username);
      if (parsed) return parsed;
    } catch {
      // try next url
    }
  }

  return null;
}

/**
 * @param {string} html
 * @param {string} username
 */
function parseTelegramHtml(html, username) {
  if (/tgme_page_error|If you have.{0,40}Telegram/i.test(html) && !/tgme_page_title/i.test(html)) {
    return null;
  }

  const title =
    meta(html, "og:title") ||
    textByClass(html, "tgme_page_title") ||
    username;

  const description =
    meta(html, "og:description") ||
    textByClass(html, "tgme_page_description") ||
    "";

  const membersRaw =
    textByClass(html, "tgme_page_extra") ||
    "";

  const membersCount = parseMembers(membersRaw);
  const lower = html.toLowerCase();
  const looksBot =
    /bot$/i.test(username) ||
    /\bbot\b/i.test(membersRaw) ||
    /tgme_icon_user/i.test(html);
  const looksGroup =
    /subscribers|obunachi|участник|member|members/.test(membersRaw.toLowerCase()) === false &&
    /member|участник|a'zo|azo/.test(membersRaw.toLowerCase());

  // Heuristic: preview pages for channels usually say "subscribers"
  const type = looksBot
    ? "bot"
    : /subscriber|obunachi|подписчик/i.test(membersRaw)
      ? "channel"
      : looksGroup || /group|супергруппа|supergroup/i.test(lower)
        ? "group"
        : "channel";

  if (!title || title.toLowerCase() === "telegram") {
    return null;
  }

  return {
    username,
    title: cleanText(title).replace(/\s+[\-–—]\s*Telegram$/i, ""),
    description: cleanText(description),
    type,
    membersCount,
    telegramId: null,
    verified: false,
    source: "tme_preview",
  };
}

/**
 * @param {string} html
 * @param {string} property
 */
function meta(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  const match = html.match(re) || html.match(alt);
  return match ? decodeHtml(match[1]) : "";
}

/**
 * @param {string} html
 * @param {string} className
 */
function textByClass(html, className) {
  const re = new RegExp(
    `class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)</`,
    "i",
  );
  const match = html.match(re);
  if (!match) return "";
  return cleanText(match[1]);
}

/**
 * @param {string} value
 */
function parseMembers(value) {
  const text = value.replace(/\u00a0/g, " ").trim();
  const match = text.match(/([\d\s.,]+)\s*(subscribers|members|obunachi|участник|подписчик)/i);
  if (!match) {
    const digits = text.match(/([\d\s.,]+)/);
    if (!digits) return 0;
    return Number(digits[1].replace(/[^\d]/g, "")) || 0;
  }
  return Number(match[1].replace(/[^\d]/g, "")) || 0;
}

/**
 * @param {string} value
 */
function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} value
 */
function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * @param {string} text
 */
export function extractUsernames(text) {
  const re = /(?:https?:\/\/t\.me\/|@)([a-zA-Z][a-zA-Z0-9_]{3,31})/g;
  /** @type {Set<string>} */
  const found = new Set();
  let match;
  while ((match = re.exec(text || "")) !== null) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}
