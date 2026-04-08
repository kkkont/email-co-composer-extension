import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import languagesJson from "../../../../languages.json";

// Dynamically import all locale JSON files
const localeModules = import.meta.glob("./locales/*.json", { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

const resources: Record<string, { translation: Record<string, unknown> }> = {
  en: { translation: en },
};

for (const [path, module] of Object.entries(localeModules)) {
  const code = path.match(/\/(\w+)\.json$/)?.[1];
  if (code && code !== "en") {
    resources[code] = { translation: module.default };
  }
}

export const availableLanguages = Object.keys(resources).sort();

export const languageNames: Record<string, string> = {
  en: "English",
  ...Object.fromEntries(languagesJson.map((l) => [l.code, l.name])),
};

const browserLang = navigator.language.split("-")[0];
const detectedLng = availableLanguages.includes(browserLang) ? browserLang : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: detectedLng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
