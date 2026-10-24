export const LANGUAGES = [
  { id: "uz", label: "O‘zbek", short: "UZ" },
  { id: "ru", label: "Rus", short: "RU" },
  { id: "en", label: "Ingliz", short: "EN" },
];

/**
 * @param {string | null | undefined} code
 */
export function languageLabel(code) {
  const found = LANGUAGES.find((item) => item.id === code);
  return found?.label || code || "unknown";
}

/**
 * @param {string} text
 */
export function detectLanguage(text) {
  const value = String(text || "");
  if (/[а-яёА-ЯЁ]/.test(value)) return "ru";
  if (
    /[ʻʼ‘’'`´]|o‘|g‘|\bo'|g'|ў|қ|ғ|ҳ/i.test(value) &&
    /[a-zá-ú]/i.test(value)
  ) {
    return "uz";
  }
  if (/[a-zA-Z]/.test(value) && !/[а-яёА-ЯЁ]/.test(value)) return "en";
  return "uz";
}
