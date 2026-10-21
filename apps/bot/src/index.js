import { Bot, InlineKeyboard, Keyboard } from "grammy";
import {
  getCommunity,
  listCategories,
  listPopular,
  searchCommunities,
} from "@underdog/shared";

const token = process.env.BOT_TOKEN;
const webUrl = process.env.WEB_URL || "http://localhost:3000";

if (!token) {
  console.error(
    "BOT_TOKEN is not set. Create a bot via @BotFather and put the token in .env",
  );
  process.exit(1);
}

const bot = new Bot(token);

const MAIN_BUTTONS = {
  search: "🔍 Поиск",
  categories: "📂 Категории",
  popular: "🔥 Популярное",
  site: "🌐 Открыть сайт",
  help: "ℹ️ Помощь",
};

function mainKeyboard() {
  return new Keyboard()
    .text(MAIN_BUTTONS.search)
    .text(MAIN_BUTTONS.categories)
    .row()
    .text(MAIN_BUTTONS.popular)
    .text(MAIN_BUTTONS.site)
    .row()
    .text(MAIN_BUTTONS.help)
    .resized()
    .persistent();
}

/**
 * @param {{ title: string, username: string, type: string, categoryTitle?: string, membersCount: number, description: string }} item
 */
function formatCommunity(item) {
  const typeLabel = item.type === "channel" ? "канал" : "группа";
  const members = item.membersCount.toLocaleString("ru-RU");
  return [
    `*${escapeMarkdown(item.title)}* (@${escapeMarkdown(item.username)})`,
    `${typeLabel} · ${escapeMarkdown(item.categoryTitle || "")} · ${members} уч.`,
    escapeMarkdown(item.description),
  ].join("\n");
}

/**
 * @param {string} text
 */
function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

/**
 * @param {{ username: string, telegramUrl?: string }} item
 */
function communityKeyboard(item) {
  return new InlineKeyboard()
    .url("Открыть в Telegram", item.telegramUrl || `https://t.me/${item.username}`)
    .row()
    .url("Карточка на сайте", `${webUrl}/c/${item.username}`);
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    [
      "Underdog — поиск Telegram-каналов и групп.",
      "",
      "Выберите действие на клавиатуре или отправьте запрос текстом.",
      "Пример: `react frontend` или `крипто`.",
    ].join("\n"),
    {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard(),
    },
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    [
      "Команды и кнопки:",
      "• Поиск — подсказка и поиск по тексту",
      "• Категории — список тем",
      "• Популярное — топ по числу участников",
      "• Открыть сайт — веб-версия сервиса",
      "",
      "Просто напишите запрос сообщением — бот найдёт сообщества.",
    ].join("\n"),
    { reply_markup: mainKeyboard() },
  );
});

bot.hears(MAIN_BUTTONS.help, async (ctx) => {
  await ctx.reply(
    "Напишите ключевые слова сообщением, например: дизайн, python, новости.",
    { reply_markup: mainKeyboard() },
  );
});

bot.hears(MAIN_BUTTONS.site, async (ctx) => {
  await ctx.reply(`Веб-версия: ${webUrl}`, {
    reply_markup: new InlineKeyboard().url("Открыть сайт", webUrl),
  });
});

bot.hears(MAIN_BUTTONS.popular, async (ctx) => {
  const { items } = listPopular(5);
  if (!items.length) {
    await ctx.reply("Пока нет данных.");
    return;
  }
  for (const item of items) {
    await ctx.reply(formatCommunity(item), {
      parse_mode: "Markdown",
      reply_markup: communityKeyboard(item),
    });
  }
});

bot.hears(MAIN_BUTTONS.categories, async (ctx) => {
  const categories = listCategories();
  const keyboard = new InlineKeyboard();
  categories.forEach((category, index) => {
    keyboard.text(
      `${category.title} (${category.count})`,
      `cat:${category.id}`,
    );
    if (index % 2 === 1) keyboard.row();
  });
  await ctx.reply("Выберите категорию:", { reply_markup: keyboard });
});

bot.hears(MAIN_BUTTONS.search, async (ctx) => {
  await ctx.reply(
    "Введите запрос следующим сообщением.\nПример: `ai agents` или `удалёнка`.",
    { parse_mode: "Markdown", reply_markup: mainKeyboard() },
  );
});

bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
  const categoryId = ctx.match[1];
  const { items, total } = searchCommunities({
    category: categoryId,
    limit: 5,
    sort: "members",
  });
  await ctx.answerCallbackQuery();
  if (!items.length) {
    await ctx.reply("В этой категории пока пусто.");
    return;
  }
  await ctx.reply(`Найдено: ${total}. Топ результатов:`);
  for (const item of items) {
    await ctx.reply(formatCommunity(item), {
      parse_mode: "Markdown",
      reply_markup: communityKeyboard(item),
    });
  }
});

bot.callbackQuery(/^open:(.+)$/, async (ctx) => {
  const item = getCommunity(ctx.match[1]);
  await ctx.answerCallbackQuery();
  if (!item) {
    await ctx.reply("Сообщество не найдено.");
    return;
  }
  await ctx.reply(formatCommunity(item), {
    parse_mode: "Markdown",
    reply_markup: communityKeyboard(item),
  });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (Object.values(MAIN_BUTTONS).includes(text)) return;

  const { items, total } = searchCommunities({
    q: text,
    limit: 5,
    sort: "members",
  });

  if (!items.length) {
    await ctx.reply(
      "Ничего не нашёл. Попробуйте другое слово или откройте категории.",
      { reply_markup: mainKeyboard() },
    );
    return;
  }

  await ctx.reply(`По запросу «${text}» найдено: ${total}`);
  for (const item of items) {
    await ctx.reply(formatCommunity(item), {
      parse_mode: "Markdown",
      reply_markup: communityKeyboard(item),
    });
  }
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});

bot.start({
  onStart: (info) => {
    console.log(`Underdog bot @${info.username} started (polling)`);
  },
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
