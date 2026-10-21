/** @typedef {'ru' | 'en' | 'uz'} Lang */

/** @type {Lang[]} */
export const LANGS = ["ru", "en", "uz"];

export const LANG_LABELS = {
  ru: "Русский",
  en: "English",
  uz: "Oʻzbekcha",
};

/** @type {Record<Lang, Record<string, string>>} */
const dict = {
  ru: {
    btn_search: "🔍 Поиск",
    btn_categories: "📂 Категории",
    btn_popular: "🔥 Популярное",
    btn_site: "🌐 Открыть сайт",
    btn_help: "ℹ️ Помощь",
    btn_admin: "🛠 Админ",
    btn_lang: "🌐 Язык",
    btn_open_tg: "Открыть в Telegram",
    btn_open_site: "На сайте",
    choose_lang: "Выберите язык / Choose language / Tilni tanlang:",
    lang_set: "Язык: Русский",
    start:
      "Underdog — поиск Telegram-каналов и групп.\n\nНапишите запрос текстом или выберите кнопку.\nВ ответе — список названий; номер откроет ссылку и описание.",
    help:
      "Команды и кнопки:\n• /search — поиск\n• /categories — список тем\n• /popular — топ\n• /site — сайт\n• /lang — язык\n• Меню слева от поля ввода\n\nПосле поиска: список названий + кнопки 1–8.\nНажмите номер — придёт ссылка и описание.",
    help_admin: "• /admin — статистика бота",
    search_hint:
      "Введите запрос следующим сообщением.\nПример: `ai agents` или `крипто`.",
    site: "Веб-версия:",
    choose_category: "Выберите категорию:",
    no_access: "Недостаточно прав.",
    list_stale: "Список устарел. Сделайте новый поиск.",
    item_missing: "Пункт не найден",
    list_closed: "Список закрыт.",
    results: "Результаты",
    nothing: "Ничего не найдено.",
    pick_hint: "Выберите номер кнопкой ниже.",
    channel: "канал",
    group: "группа",
    members: "участников",
    popular_label: "Популярное",
    admin_title: "🛠 Статистика бота",
    admin_uptime: "Аптайм",
    admin_users: "Уникальные пользователи",
    admin_messages: "Сообщений",
    admin_starts: "/start",
    admin_searches: "Поисков",
    admin_popular: "Популярное",
    admin_categories: "Категории",
    admin_site: "Сайт",
    admin_help: "Помощь",
    admin_admin_views: "Просмотров админки",
    admin_catalog: "Каталог",
    admin_total: "Всего",
    admin_channels: "Каналы",
    admin_groups: "Группы",
    admin_note: "Счётчики в памяти — сбрасываются при рестарте бота.",
    cmd_start: "Запустить бота",
    cmd_search: "Поиск каналов и групп",
    cmd_categories: "Категории",
    cmd_popular: "Популярное",
    cmd_site: "Открыть сайт",
    cmd_help: "Помощь",
    cmd_lang: "Язык",
    cmd_admin: "Статистика бота (админ)",
    cat_tech: "Технологии",
    cat_crypto: "Крипто и финансы",
    cat_design: "Дизайн",
    cat_marketing: "Маркетинг",
    cat_education: "Обучение",
    cat_lifestyle: "Лайфстайл",
    cat_news: "Новости",
    cat_games: "Игры",
  },
  en: {
    btn_search: "🔍 Search",
    btn_categories: "📂 Categories",
    btn_popular: "🔥 Popular",
    btn_site: "🌐 Open website",
    btn_help: "ℹ️ Help",
    btn_admin: "🛠 Admin",
    btn_lang: "🌐 Language",
    btn_open_tg: "Open in Telegram",
    btn_open_site: "On website",
    choose_lang: "Choose language / Выберите язык / Tilni tanlang:",
    lang_set: "Language: English",
    start:
      "Underdog — find Telegram channels and groups.\n\nType a query or use a button.\nYou get a title list; tap a number for the link and details.",
    help:
      "Commands and buttons:\n• /search — search\n• /categories — topics\n• /popular — top\n• /site — website\n• /lang — language\n• Menu next to the input field\n\nAfter search: title list + buttons 1–8.\nTap a number to get the link and description.",
    help_admin: "• /admin — bot stats",
    search_hint:
      "Send your query in the next message.\nExample: `ai agents` or `crypto`.",
    site: "Website:",
    choose_category: "Choose a category:",
    no_access: "Access denied.",
    list_stale: "List expired. Start a new search.",
    item_missing: "Item not found",
    list_closed: "List closed.",
    results: "Results",
    nothing: "Nothing found.",
    pick_hint: "Pick a number with the buttons below.",
    channel: "channel",
    group: "group",
    members: "members",
    popular_label: "Popular",
    admin_title: "🛠 Bot stats",
    admin_uptime: "Uptime",
    admin_users: "Unique users",
    admin_messages: "Messages",
    admin_starts: "/start",
    admin_searches: "Searches",
    admin_popular: "Popular",
    admin_categories: "Categories",
    admin_site: "Website",
    admin_help: "Help",
    admin_admin_views: "Admin views",
    admin_catalog: "Catalog",
    admin_total: "Total",
    admin_channels: "Channels",
    admin_groups: "Groups",
    admin_note: "Counters are in memory and reset when the bot restarts.",
    cmd_start: "Start the bot",
    cmd_search: "Search channels and groups",
    cmd_categories: "Categories",
    cmd_popular: "Popular",
    cmd_site: "Open website",
    cmd_help: "Help",
    cmd_lang: "Language",
    cmd_admin: "Bot stats (admin)",
    cat_tech: "Technology",
    cat_crypto: "Crypto & finance",
    cat_design: "Design",
    cat_marketing: "Marketing",
    cat_education: "Education",
    cat_lifestyle: "Lifestyle",
    cat_news: "News",
    cat_games: "Games",
  },
  uz: {
    btn_search: "🔍 Qidiruv",
    btn_categories: "📂 Kategoriyalar",
    btn_popular: "🔥 Mashhur",
    btn_site: "🌐 Saytni ochish",
    btn_help: "ℹ️ Yordam",
    btn_admin: "🛠 Admin",
    btn_lang: "🌐 Til",
    btn_open_tg: "Telegramda ochish",
    btn_open_site: "Saytda",
    choose_lang: "Tilni tanlang / Choose language / Выберите язык:",
    lang_set: "Til: Oʻzbekcha",
    start:
      "Underdog — Telegram kanallar va guruhlarni qidirish.\n\nSo‘rov yozing yoki tugmani bosing.\nJavobda nomlar ro‘yxati; raqamni bosing — havola va tavsif keladi.",
    help:
      "Buyruqlar va tugmalar:\n• /search — qidiruv\n• /categories — mavzular\n• /popular — top\n• /site — sayt\n• /lang — til\n• Kiritish maydoni yonidagi menyu\n\nQidiruvdan keyin: nomlar + 1–8 tugmalar.\nRaqamni bosing — havola va tavsif keladi.",
    help_admin: "• /admin — bot statistikasi",
    search_hint:
      "Keyingi xabarda so‘rov yuboring.\nMasalan: `ai agents` yoki `kripto`.",
    site: "Veb-sayt:",
    choose_category: "Kategoriyani tanlang:",
    no_access: "Ruxsat yo‘q.",
    list_stale: "Ro‘yxat eskirgan. Yangi qidiruv qiling.",
    item_missing: "Element topilmadi",
    list_closed: "Ro‘yxat yopildi.",
    results: "Natijalar",
    nothing: "Hech narsa topilmadi.",
    pick_hint: "Pastdagi tugmalar bilan raqamni tanlang.",
    channel: "kanal",
    group: "guruh",
    members: "obunachi",
    popular_label: "Mashhur",
    admin_title: "🛠 Bot statistikasi",
    admin_uptime: "Ishlash vaqti",
    admin_users: "Noyob foydalanuvchilar",
    admin_messages: "Xabarlar",
    admin_starts: "/start",
    admin_searches: "Qidiruvlar",
    admin_popular: "Mashhur",
    admin_categories: "Kategoriyalar",
    admin_site: "Sayt",
    admin_help: "Yordam",
    admin_admin_views: "Admin ko‘rishlari",
    admin_catalog: "Katalog",
    admin_total: "Jami",
    admin_channels: "Kanallar",
    admin_groups: "Guruhlar",
    admin_note: "Hisoblagichlar xotirada — bot qayta ishga tushganda nolga tushadi.",
    cmd_start: "Botni ishga tushirish",
    cmd_search: "Kanal va guruh qidirish",
    cmd_categories: "Kategoriyalar",
    cmd_popular: "Mashhur",
    cmd_site: "Saytni ochish",
    cmd_help: "Yordam",
    cmd_lang: "Til",
    cmd_admin: "Bot statistikasi (admin)",
    cat_tech: "Texnologiyalar",
    cat_crypto: "Kripto va moliya",
    cat_design: "Dizayn",
    cat_marketing: "Marketing",
    cat_education: "Ta’lim",
    cat_lifestyle: "Hayot tarzi",
    cat_news: "Yangiliklar",
    cat_games: "O‘yinlar",
  },
};

/**
 * @param {unknown} value
 * @returns {value is Lang}
 */
export function isLang(value) {
  return value === "ru" || value === "en" || value === "uz";
}

/**
 * @param {Lang} lang
 * @param {string} key
 */
export function t(lang, key) {
  return dict[lang]?.[key] || dict.ru[key] || key;
}

/**
 * @param {string} categoryId
 * @param {Lang} lang
 */
export function categoryTitle(categoryId, lang) {
  return t(lang, `cat_${categoryId}`);
}

/**
 * Collect all localized main-button labels for hears matching.
 */
export function allButtonLabels() {
  /** @type {Set<string>} */
  const labels = new Set();
  for (const lang of LANGS) {
    labels.add(t(lang, "btn_search"));
    labels.add(t(lang, "btn_categories"));
    labels.add(t(lang, "btn_popular"));
    labels.add(t(lang, "btn_site"));
    labels.add(t(lang, "btn_help"));
    labels.add(t(lang, "btn_admin"));
    labels.add(t(lang, "btn_lang"));
  }
  return labels;
}
