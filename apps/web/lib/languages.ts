export const LANGUAGES = [
  { id: "uz", label: "O‘zbek", short: "UZ" },
  { id: "ru", label: "Rus", short: "RU" },
  { id: "en", label: "Ingliz", short: "EN" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export function languageLabel(code: string | null | undefined) {
  const found = LANGUAGES.find((item) => item.id === code);
  return found?.label || code || "Noma’lum";
}

export function languageShort(code: string | null | undefined) {
  const found = LANGUAGES.find((item) => item.id === code);
  return found?.short || String(code || "?").toUpperCase();
}
