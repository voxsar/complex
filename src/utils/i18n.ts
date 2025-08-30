import path from "path";
import i18n from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

i18n
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "es"],
    backend: {
      loadPath: path.join(__dirname, "../../locales/{{lng}}/translation.json"),
    },
    detection: {
      order: ["querystring", "header"],
      lookupQuerystring: "locale",
    },
  });

export default i18n;
export const i18nextMiddleware = middleware;
