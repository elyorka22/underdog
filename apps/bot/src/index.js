import { Bot, InlineKeyboard } from "grammy";
import {
  getStats,
  listCategories,
  searchCommunities,
} from "@underdog/shared";
import {
  LANG_LABELS,
  LANGS,
  allButtonLabels,
  categoryTitle,
  isLang,
  t,
} from "./i18n.js";

/** Removes sticky reply keyboard under the input field. */
const REMOVE_KEYBOARD = { remove_keyboard: true };

const token = process.env.BOT_TOKEN;
const webUrl = process.env.WEB_URL || "http://localhost:3000";
const adminChatId = Number(process.env.ADMIN_CHAT_ID || 0);
const PAGE_SIZE = 8;
const DEFAULT_LANG = "ru";

if (!token) {
  console.error(
    "BOT_TOKEN is not set. Create a bot via @BotFather and put the token in .env",
  );
  process.exit(1);
}

const bot = new Bot(token);
const startedAt = Date.now();
const buttonLabels = allButtonLabels();

const stats = {
  starts: 0,
  searches: 0,
  popularViews: 0,
  categoryViews: 0,
  helpViews: 0,
  siteViews: 0,
  adminViews: 0,
  messages: 0,
  /** @type {Set<number>} */
  users: new Set(),
};

/**
 * @type {Map<number, import('./i18n.js').Lang>}
 */
const userLang = new Map();

/**
 * @type {Map<number, { q: string, category: string, type: string, page: number, label: string }>}
 */
const sessions = new Map();

/**
 * @param {import('grammy').Context} ctx
 * @returns {import('./i18n.js').Lang}
 */
function langOf(ctx) {
  const id = ctx.from?.id;
  if (id && userLang.has(id)) {
    return /** @type {import('./i18n.js').Lang} */ (userLang.get(id));
  }
  const code = (ctx.from?.language_code || "").toLowerCase();
  if (code.startsWith("uz")) return "uz";
  if (code.startsWith("en")) return "en";
  if (code.startsWith("ru")) return "ru";
  return DEFAULT_LANG;
}

/**
 * @param {import('grammy').Context} ctx
 * @param {import('./i18n.js').Lang} lang
 */
function setLang(ctx, lang) {
  if (ctx.from?.id) userLang.set(ctx.from.id, lang);
}

/**
 * @param {import('grammy').Context} ctx
 */
function isAdmin(ctx) {
  if (!adminChatId) return false;
  return ctx.chat?.id === adminChatId || ctx.from?.id === adminChatId;
}

/**
 * @param {import('grammy').Context} ctx
 */
function trackUser(ctx) {
  stats.messages += 1;
  if (ctx.from?.id) stats.users.add(ctx.from.id);
}

/**
 * @param {string} text
 */
function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

/**
 * @param {import('./i18n.js').Lang} lang
 * @param {{ title: string, username: string, type: string, language?: string, categoryId?: string, categoryTitle?: string, membersCount: number, description: string, telegramUrl?: string, tags?: string[] }} item
 */
function formatCommunityDetail(lang, item) {
  const typeLabel =
    item.type === "channel" ? t(lang, "channel") : t(lang, "group");
  const members = item.membersCount.toLocaleString(
    lang === "en" ? "en-US" : lang === "uz" ? "uz-UZ" : "ru-RU",
  );
  const cat =
    item.categoryId != null
      ? categoryTitle(item.categoryId, lang)
      : item.categoryTitle || "";
  const langCode = String(item.language || "uz").toUpperCase();
  const tags = (item.tags || []).map((tag) => `#${tag}`).join(" ");
  return [
    `*${escapeMarkdown(item.title)}*`,
    `@${escapeMarkdown(item.username)} · ${typeLabel} · ${langCode} · ${escapeMarkdown(cat)}`,
    `${members} ${t(lang, "members")}`,
    "",
    escapeMarkdown(item.description),
    tags ? `\n${escapeMarkdown(tags)}` : "",
    "",
    escapeMarkdown(item.telegramUrl || `https://t.me/${item.username}`),
  ].join("\n");
}

/**
 * @param {import('./i18n.js').Lang} lang
 * @param {{ username: string, telegramUrl?: string }} item
 */
function communityKeyboard(lang, item) {
  return new InlineKeyboard()
    .url(
      t(lang, "btn_open_tg"),
      item.telegramUrl || `https://t.me/${item.username}`,
    )
    .row()
    .url(t(lang, "btn_open_site"), `${webUrl}/c/${item.username}`);
}

/**
 * @param {object} params
 * @param {string} [params.q]
 * @param {string} [params.category]
 * @param {string} [params.type]
 * @param {number} [params.page]
 */
function fetchPage(params) {
  const page = Math.max(params.page || 0, 0);
  const result = searchCommunities({
    q: params.q || "",
    category: params.category || "all",
    type: params.type || "all",
    sort: "members",
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);
  return { ...result, page, totalPages };
}

/**
 * @param {import('./i18n.js').Lang} lang
 * @param {{ label: string, items: Array<{ title: string, type: string, language?: string }>, total: number, page: number }} data
 */
function formatResultsList(lang, data) {
  if (!data.items.length) {
    return `🔍 ${data.label}\n${t(lang, "nothing")}`;
  }

  const from = data.page * PAGE_SIZE + 1;
  const to = data.page * PAGE_SIZE + data.items.length;
  const lines = [
    `🔍 ${data.label}`,
    `${t(lang, "results")} ${from}-${to} / ${data.total}`,
    "",
  ];

  data.items.forEach((item, index) => {
    const typeMark = item.type === "channel" ? "📢" : "💬";
    const langMark = String(item.language || "uz").toUpperCase();
    lines.push(`${index + 1}. ${typeMark} [${langMark}] ${item.title}`);
  });

  lines.push("", t(lang, "pick_hint"));
  return lines.join("\n");
}

/**
 * @param {{ items: unknown[], page: number, totalPages: number }} data
 */
function resultsKeyboard(data) {
  const keyboard = new InlineKeyboard();
  const count = data.items.length;

  for (let i = 0; i < count; i += 1) {
    keyboard.text(String(i + 1), `pick:${i}`);
    if ((i + 1) % 4 === 0 || i === count - 1) {
      keyboard.row();
    }
  }

  keyboard.text(data.page > 0 ? "⬅️" : "·", data.page > 0 ? "nav:prev" : "nav:noop");
  keyboard.text("❌", "nav:close");
  keyboard.text(
    data.page < data.totalPages - 1 ? "➡️" : "·",
    data.page < data.totalPages - 1 ? "nav:next" : "nav:noop",
  );

  return keyboard;
}

function languageKeyboard() {
  const keyboard = new InlineKeyboard();
  for (const lang of LANGS) {
    keyboard.text(LANG_LABELS[lang], `lang:${lang}`);
  }
  return keyboard;
}

/**
 * @param {import('grammy').Context} ctx
 * @param {{ q?: string, category?: string, type?: string, label: string, page?: number }} options
 * @param {{ edit?: boolean }} [mode]
 */
async function sendResults(ctx, options, mode = {}) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const lang = langOf(ctx);

  const page = options.page || 0;
  const session = {
    q: options.q || "",
    category: options.category || "all",
    type: options.type || "all",
    page,
    label: options.label,
  };
  sessions.set(chatId, session);

  const data = fetchPage(session);
  session.page = data.page;
  sessions.set(chatId, session);

  const text = formatResultsList(lang, {
    label: session.label,
    items: data.items,
    total: data.total,
    page: data.page,
  });
  const replyMarkup = resultsKeyboard(data);

  if (mode.edit && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, { reply_markup: replyMarkup });
    return;
  }

  await ctx.reply(text, { reply_markup: replyMarkup });
}

function formatUptime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replyLangMenu(ctx) {
  trackUser(ctx);
  await ctx.reply(t(langOf(ctx), "choose_lang"), {
    reply_markup: languageKeyboard(),
  });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replyAdminStats(ctx) {
  const lang = langOf(ctx);
  if (!isAdmin(ctx)) {
    await ctx.reply(t(lang, "no_access"));
    return;
  }

  stats.adminViews += 1;
  const catalog = getStats();
  const text = [
    `*${escapeMarkdown(t(lang, "admin_title"))}*`,
    "",
    `${t(lang, "admin_uptime")}: ${escapeMarkdown(formatUptime(Date.now() - startedAt))}`,
    `${t(lang, "admin_users")}: ${stats.users.size}`,
    `${t(lang, "admin_messages")}: ${stats.messages}`,
    `${escapeMarkdown(t(lang, "admin_starts"))}: ${stats.starts}`,
    `${t(lang, "admin_searches")}: ${stats.searches}`,
    `${t(lang, "admin_popular")}: ${stats.popularViews}`,
    `${t(lang, "admin_categories")}: ${stats.categoryViews}`,
    `${t(lang, "admin_site")}: ${stats.siteViews}`,
    `${t(lang, "admin_help")}: ${stats.helpViews}`,
    `${t(lang, "admin_admin_views")}: ${stats.adminViews}`,
    "",
    `*${escapeMarkdown(t(lang, "admin_catalog"))}*`,
    `${t(lang, "admin_total")}: ${catalog.total}`,
    `${t(lang, "admin_channels")}: ${catalog.channels}`,
    `${t(lang, "admin_groups")}: ${catalog.groups}`,
    `${t(lang, "admin_categories")}: ${catalog.categories}`,
    "",
    `_${escapeMarkdown(t(lang, "admin_note"))}_`,
  ].join("\n");

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: REMOVE_KEYBOARD,
  });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replyHelp(ctx) {
  trackUser(ctx);
  stats.helpViews += 1;
  const lang = langOf(ctx);
  const lines = [t(lang, "help")];
  if (isAdmin(ctx)) lines.push(t(lang, "help_admin"));
  await ctx.reply(lines.join("\n"), { reply_markup: REMOVE_KEYBOARD });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replySearchHint(ctx) {
  trackUser(ctx);
  const lang = langOf(ctx);
  await ctx.reply(t(lang, "search_hint"), {
    parse_mode: "Markdown",
    reply_markup: REMOVE_KEYBOARD,
  });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replySite(ctx) {
  trackUser(ctx);
  stats.siteViews += 1;
  const lang = langOf(ctx);
  await ctx.reply(`${t(lang, "site")} ${webUrl}`, {
    reply_markup: new InlineKeyboard().url(t(lang, "btn_site"), webUrl),
  });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replyPopular(ctx) {
  trackUser(ctx);
  stats.popularViews += 1;
  stats.searches += 1;
  const lang = langOf(ctx);
  await sendResults(ctx, {
    q: "",
    category: "all",
    type: "all",
    label: t(lang, "popular_label"),
    page: 0,
  });
}

/**
 * @param {import('grammy').Context} ctx
 */
async function replyCategories(ctx) {
  trackUser(ctx);
  stats.categoryViews += 1;
  const lang = langOf(ctx);
  const categories = listCategories();
  const keyboard = new InlineKeyboard();
  categories.forEach((category, index) => {
    keyboard.text(
      `${categoryTitle(category.id, lang)} (${category.count})`,
      `cat:${category.id}`,
    );
    if (index % 2 === 1) keyboard.row();
  });
  await ctx.reply(t(lang, "choose_category"), { reply_markup: keyboard });
}

/**
 * @param {import('grammy').Context} ctx
 * @param {string} text
 */
function matchButton(ctx, text) {
  const lang = langOf(ctx);
  if (text === t(lang, "btn_search")) return "search";
  if (text === t(lang, "btn_categories")) return "categories";
  if (text === t(lang, "btn_popular")) return "popular";
  if (text === t(lang, "btn_site")) return "site";
  if (text === t(lang, "btn_help")) return "help";
  if (text === t(lang, "btn_lang")) return "lang";
  if (text === t(lang, "btn_admin")) return "admin";

  // Fallback: user changed language but old keyboard still visible
  for (const code of LANGS) {
    if (text === t(code, "btn_search")) return "search";
    if (text === t(code, "btn_categories")) return "categories";
    if (text === t(code, "btn_popular")) return "popular";
    if (text === t(code, "btn_site")) return "site";
    if (text === t(code, "btn_help")) return "help";
    if (text === t(code, "btn_lang")) return "lang";
    if (text === t(code, "btn_admin")) return "admin";
  }
  return null;
}

bot.command("start", async (ctx) => {
  trackUser(ctx);
  stats.starts += 1;
  await ctx.reply(t("ru", "welcome_pick_lang"), {
    reply_markup: languageKeyboard(),
  });
});

bot.command("help", replyHelp);
bot.command("search", replySearchHint);
bot.command("categories", replyCategories);
bot.command("popular", replyPopular);
bot.command("site", replySite);
bot.command("lang", replyLangMenu);
bot.command("admin", replyAdminStats);

bot.callbackQuery(/^lang:(ru|en|uz)$/, async (ctx) => {
  trackUser(ctx);
  const next = ctx.match[1];
  if (!isLang(next)) {
    await ctx.answerCallbackQuery();
    return;
  }
  setLang(ctx, next);
  await ctx.answerCallbackQuery({ text: LANG_LABELS[next] });
  try {
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
  } catch {
    // ignore if message can't be edited
  }
  await ctx.reply(`${t(next, "lang_set")}\n\n${t(next, "start")}`, {
    reply_markup: REMOVE_KEYBOARD,
  });
});

bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
  trackUser(ctx);
  await ctx.answerCallbackQuery();
  const categoryId = ctx.match[1];
  const lang = langOf(ctx);
  stats.searches += 1;
  await sendResults(ctx, {
    q: "",
    category: categoryId,
    type: "all",
    label: categoryTitle(categoryId, lang),
    page: 0,
  });
});

bot.callbackQuery(/^pick:(\d+)$/, async (ctx) => {
  trackUser(ctx);
  const lang = langOf(ctx);
  const index = Number(ctx.match[1]);
  const chatId = ctx.chat?.id;
  const session = chatId ? sessions.get(chatId) : undefined;

  if (!session) {
    await ctx.answerCallbackQuery({ text: t(lang, "list_stale") });
    return;
  }

  const data = fetchPage(session);
  const item = data.items[index];
  if (!item) {
    await ctx.answerCallbackQuery({ text: t(lang, "item_missing") });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.reply(formatCommunityDetail(lang, item), {
    parse_mode: "Markdown",
    reply_markup: communityKeyboard(lang, item),
    link_preview_options: { is_disabled: true },
  });
});

bot.callbackQuery(/^nav:(prev|next|close|noop)$/, async (ctx) => {
  trackUser(ctx);
  const lang = langOf(ctx);
  const action = ctx.match[1];
  const chatId = ctx.chat?.id;
  const session = chatId ? sessions.get(chatId) : undefined;

  if (action === "noop") {
    await ctx.answerCallbackQuery();
    return;
  }

  if (action === "close") {
    await ctx.answerCallbackQuery();
    if (chatId) sessions.delete(chatId);
    try {
      await ctx.deleteMessage();
    } catch {
      await ctx.editMessageText(t(lang, "list_closed"));
    }
    return;
  }

  if (!session) {
    await ctx.answerCallbackQuery({ text: t(lang, "list_stale") });
    return;
  }

  session.page = Math.max(
    action === "next" ? session.page + 1 : session.page - 1,
    0,
  );
  sessions.set(chatId, session);
  await ctx.answerCallbackQuery();
  await sendResults(ctx, { ...session, page: session.page }, { edit: true });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return;

  const action = matchButton(ctx, text);
  if (action === "search") return replySearchHint(ctx);
  if (action === "categories") return replyCategories(ctx);
  if (action === "popular") return replyPopular(ctx);
  if (action === "site") return replySite(ctx);
  if (action === "help") return replyHelp(ctx);
  if (action === "lang") return replyLangMenu(ctx);
  if (action === "admin") return replyAdminStats(ctx);
  if (buttonLabels.has(text)) return;

  trackUser(ctx);
  stats.searches += 1;

  await sendResults(ctx, {
    q: text,
    category: "all",
    type: "all",
    label: text,
    page: 0,
  });
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

async function setupBotMenu() {
  const ru = "ru";
  await bot.api.setMyCommands([
    { command: "start", description: t(ru, "cmd_start") },
    { command: "search", description: t(ru, "cmd_search") },
    { command: "categories", description: t(ru, "cmd_categories") },
    { command: "popular", description: t(ru, "cmd_popular") },
    { command: "site", description: t(ru, "cmd_site") },
    { command: "lang", description: t(ru, "cmd_lang") },
    { command: "help", description: t(ru, "cmd_help") },
  ]);

  await bot.api.setChatMenuButton({
    menu_button: { type: "commands" },
  });

  for (const lang of LANGS) {
    await bot.api.setMyCommands(
      [
        { command: "start", description: t(lang, "cmd_start") },
        { command: "search", description: t(lang, "cmd_search") },
        { command: "categories", description: t(lang, "cmd_categories") },
        { command: "popular", description: t(lang, "cmd_popular") },
        { command: "site", description: t(lang, "cmd_site") },
        { command: "lang", description: t(lang, "cmd_lang") },
        { command: "help", description: t(lang, "cmd_help") },
      ],
      { language_code: lang },
    );
  }

  if (adminChatId) {
    await bot.api.setMyCommands(
      [
        { command: "start", description: t(ru, "cmd_start") },
        { command: "search", description: t(ru, "cmd_search") },
        { command: "categories", description: t(ru, "cmd_categories") },
        { command: "popular", description: t(ru, "cmd_popular") },
        { command: "site", description: t(ru, "cmd_site") },
        { command: "lang", description: t(ru, "cmd_lang") },
        { command: "help", description: t(ru, "cmd_help") },
        { command: "admin", description: t(ru, "cmd_admin") },
      ],
      { scope: { type: "chat", chat_id: adminChatId } },
    );
    console.log(`Admin menu scoped to chat_id=${adminChatId}`);
  } else {
    console.warn("ADMIN_CHAT_ID is not set — admin button/stats disabled");
  }
}

setupBotMenu()
  .then(() => {
    bot.start({
      onStart: (info) => {
        console.log(`Underdog bot @${info.username} started (polling)`);
      },
    });
  })
  .catch((error) => {
    console.error("Failed to register bot menu:", error);
    process.exit(1);
  });

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
