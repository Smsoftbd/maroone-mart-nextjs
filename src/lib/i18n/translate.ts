export type Dictionary = Record<string, string>;

/** Look up a UI-chrome string, falling back to the provided text then the key. */
export function translate(dict: Dictionary, key: string, fallback?: string): string {
  return dict[key] ?? fallback ?? key;
}

/** Bind a dictionary into a `t(key, fallback)` function (for server components). */
export function makeT(dict: Dictionary) {
  return (key: string, fallback?: string) => translate(dict, key, fallback);
}
