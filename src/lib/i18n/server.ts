import "server-only";

import { getLocale } from "./locale";
import { makeT } from "./translate";
import { getTranslations } from "@/lib/api/store";

/**
 * Server-component translator: fetches the UI-chrome dictionary for the active
 * locale and returns a `t(key, fallback)` function. Client components should use
 * `useT()` from I18nProvider instead.
 *
 *   const t = await getServerT();
 *   <h1>{t("checkout", "Checkout")}</h1>
 */
export async function getServerT() {
  const locale = await getLocale();
  const dict = await getTranslations(locale);
  return makeT(dict);
}
