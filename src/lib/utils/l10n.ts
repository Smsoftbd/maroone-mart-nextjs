export type LocalizedString = { en?: string; bn?: string; [lang: string]: string | undefined };

export function resolveL10n(val: LocalizedString | string | undefined | null, lang = "en"): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.en ?? val.bn ?? Object.values(val).find(Boolean) ?? "";
}
