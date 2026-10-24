/**
 * @typedef {'channel' | 'group' | 'bot'} CommunityType
 * @typedef {{ id: string, title: string, description: string, appliesTo: CommunityType[] }} Category
 */

const CG = /** @type {CommunityType[]} */ (["channel", "group"]);
const C = /** @type {CommunityType[]} */ (["channel"]);
const G = /** @type {CommunityType[]} */ (["group"]);
const B = /** @type {CommunityType[]} */ (["bot"]);
const ALL = /** @type {CommunityType[]} */ (["channel", "group", "bot"]);

/** @type {Category[]} */
export const categories = [
  // Shared channel + chat topics
  { id: "tech", title: "Dasturlash", description: "Kod, kurslar, jamoalar", appliesTo: CG },
  { id: "ai", title: "Sun’iy intellekt", description: "AI, ChatGPT, avtomatlashtirish", appliesTo: ALL },
  { id: "mobile", title: "Mobil dasturlash", description: "Android, iOS, Flutter", appliesTo: CG },
  { id: "devops", title: "DevOps", description: "Server, CI/CD, bulut", appliesTo: CG },
  { id: "cybersecurity", title: "Kiberxavfsizlik", description: "Himoya, pentest, xavfsizlik", appliesTo: CG },
  { id: "data", title: "Data va analitika", description: "SQL, BI, data science", appliesTo: CG },
  { id: "crypto", title: "Kripto va moliya", description: "Bozor, treyding, investitsiya", appliesTo: CG },
  { id: "investing", title: "Investitsiya", description: "Aksiya, fond, portfel", appliesTo: CG },
  { id: "business", title: "Biznes", description: "Tadbirkorlik, startap, boshqaruv", appliesTo: CG },
  { id: "startups", title: "Startaplar", description: "MVP, investor, growth", appliesTo: CG },
  { id: "jobs", title: "Ish e’lonlari", description: "Vakansiya, resume, remote", appliesTo: CG },
  { id: "freelance", title: "Frilans", description: "Buyurtma, Upwork, lokal ishlar", appliesTo: CG },
  { id: "hr", title: "HR va kariyera", description: "Ishga olish, soft skills", appliesTo: CG },
  { id: "marketing", title: "Marketing", description: "SMM, reklama, o‘sish", appliesTo: CG },
  { id: "sales", title: "Sotuvlar", description: "Savdo, CRM, mijozlar", appliesTo: CG },
  { id: "design", title: "Dizayn", description: "UI/UX, grafika, ilhom", appliesTo: CG },
  { id: "photography", title: "Fotografiya", description: "Surat, video, retush", appliesTo: CG },
  { id: "video", title: "Video va montaj", description: "YouTube, reels, editing", appliesTo: CG },
  { id: "education", title: "Ta’lim", description: "Kurslar, imtihon, o‘quv materiallari", appliesTo: CG },
  { id: "languages", title: "Tillar", description: "Ingliz, rus, o‘zbek, IELTS", appliesTo: CG },
  { id: "students", title: "Talabalar", description: "Universitet, stipendiya, grant", appliesTo: CG },
  { id: "kids", title: "Bolalar", description: "Tarbiya, o‘yin, rivojlanish", appliesTo: C },
  { id: "parenting", title: "Ota-onalar", description: "Oilaviy maslahat, bola parvarishi", appliesTo: CG },
  { id: "health", title: "Salomatlik", description: "Tibbiyot, maslahat, farovonlik", appliesTo: CG },
  { id: "fitness", title: "Sport va fitnes", description: "Mashq, zal, ovqatlanish", appliesTo: CG },
  { id: "football", title: "Futbol", description: "Match, klub, yangiliklar", appliesTo: CG },
  { id: "food", title: "Ovqat va retseptlar", description: "Oshxona, kafe, retsept", appliesTo: CG },
  { id: "travel", title: "Sayohat", description: "Turizm, viza, marshrutlar", appliesTo: CG },
  { id: "cars", title: "Avtomobillar", description: "Mashina, ehtiyot qism, yo‘l", appliesTo: CG },
  { id: "realestate", title: "Ko‘chmas mulk", description: "Uy, ijara, sotuv", appliesTo: CG },
  { id: "shopping", title: "Xaridlar", description: "Chegirma, marketpleys, deals", appliesTo: CG },
  { id: "fashion", title: "Moda", description: "Kiyim, stil, trend", appliesTo: CG },
  { id: "beauty", title: "Go‘zallik", description: "Makeup, skin care, salon", appliesTo: CG },
  { id: "music", title: "Musiqa", description: "Trek, konsert, playlist", appliesTo: ALL },
  { id: "movies", title: "Kino va serial", description: "Film, serial, recenziya", appliesTo: CG },
  { id: "books", title: "Kitoblar", description: "Adabiyot, audio, tavsiya", appliesTo: CG },
  { id: "science", title: "Fan", description: "Ilm, tadqiqot, kashfiyot", appliesTo: CG },
  { id: "psychology", title: "Psixologiya", description: "Motivatsiya, muloqot, terapiya", appliesTo: CG },
  { id: "law", title: "Huquq", description: "Qonun, hujjat, maslahat", appliesTo: CG },
  { id: "news", title: "Yangiliklar", description: "Tezkor va tekshirilgan manbalar", appliesTo: C },
  { id: "media", title: "Media va blog", description: "Kontent, jurnalistika, blog", appliesTo: C },
  { id: "games", title: "O‘yinlar", description: "Gamedev, esports, strimlar", appliesTo: ALL },
  { id: "memes", title: "Memlar va hazil", description: "Kulgi, meme, short video", appliesTo: CG },
  { id: "animals", title: "Hayvonlar", description: "Uy hayvonlari, parvarish", appliesTo: CG },
  { id: "nature", title: "Tabiat", description: "Ekologiya, sayr, foto", appliesTo: C },
  { id: "religion", title: "Din va ma’naviyat", description: "Diniy suhbat, nasihat", appliesTo: CG },
  { id: "lifestyle", title: "Hayot tarzi", description: "Kundalik hayot, hobbi", appliesTo: CG },
  { id: "women", title: "Ayollar uchun", description: "Hamjamiyat, maslahat, stil", appliesTo: CG },
  { id: "men", title: "Erkaklar uchun", description: "Stil, sport, kariyera", appliesTo: CG },
  { id: "tashkent", title: "Toshkent", description: "Shahar hayoti, e’lonlar", appliesTo: CG },
  { id: "regions", title: "Viloyatlar", description: "Mahalliy yangilik va guruhlar", appliesTo: CG },
  { id: "telegram", title: "Telegram vositalari", description: "Bot, sticker, kanal marketing", appliesTo: CG },

  // Chat / group only
  { id: "dating", title: "Tanishuv", description: "Chatlar, tanishuv, muloqot", appliesTo: G },
  { id: "relationships", title: "Munosabatlar", description: "Oilaviy va shaxsiy suhbat", appliesTo: G },
  { id: "anonymous", title: "Anonim chatlar", description: "Anonim suhbat va confessions", appliesTo: G },
  { id: "local_chat", title: "Mahalliy suhbat", description: "Mahalla, shahar chatlari", appliesTo: G },
  { id: "buy_sell", title: "Oldi-sotdi chat", description: "Oldi-sotdi, barter, e’lon", appliesTo: G },
  { id: "study_chat", title: "O‘qish guruhlari", description: "Dars, homework, muhokama", appliesTo: G },
  { id: "support_chat", title: "Yordam chatlari", description: "Savol-javob, support", appliesTo: G },
  { id: "gaming_chat", title: "O‘yin chatlari", description: "Find team, lobby, clan", appliesTo: G },

  // Channel only extras
  { id: "announcements", title: "E’lon kanallari", description: "Rasmiy e’lon va yangilik", appliesTo: C },
  { id: "quotes", title: "Iqtiboslar", description: "Motivatsiya, iqtibos kanallari", appliesTo: C },

  // Bot only
  { id: "utility_bots", title: "Foydali botlar", description: "Vosita, converter, helper", appliesTo: B },
  { id: "ai_bots", title: "AI botlar", description: "ChatGPT, rasm, matn botlari", appliesTo: B },
  { id: "music_bots", title: "Musiqa botlari", description: "Music search, playlist", appliesTo: B },
  { id: "download_bots", title: "Yuklab olish botlari", description: "Video, fayl, media", appliesTo: B },
  { id: "game_bots", title: "O‘yin botlari", description: "Mini-game, quiz botlari", appliesTo: B },
  { id: "moderation_bots", title: "Moderatsiya botlari", description: "Anti-spam, admin botlar", appliesTo: B },
  { id: "translate_bots", title: "Tarjima botlari", description: "Til tarjimasi", appliesTo: B },
  { id: "payment_bots", title: "To‘lov botlari", description: "Shop, invoice, payment", appliesTo: B },
  { id: "sticker_bots", title: "Sticker botlari", description: "Sticker pack yaratish", appliesTo: B },
  { id: "search_bots", title: "Qidiruv botlari", description: "Kanal/guruh qidiruv botlari", appliesTo: B },
];

/**
 * @param {CommunityType | 'all'} [type]
 */
export function categoriesForType(type = "all") {
  if (!type || type === "all") return categories;
  return categories.filter((item) => item.appliesTo.includes(type));
}
