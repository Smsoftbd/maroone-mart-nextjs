export type Dictionary = Record<string, string>;

/** Look up a UI-chrome string, falling back to the provided text then the key (empty strings count as missing). */
export function translate(dict: Dictionary, key: string, fallback?: string): string {
  // Own-property check: an empty PHP array arrives as `[]`, whose prototype has `filter`, `map`…
  const value = Object.hasOwn(dict, key) ? dict[key] : undefined;
  return (typeof value === "string" && value) || fallback || key;
}

/** Bind a dictionary into a `t(key, fallback)` function (for server components). */
export function makeT(dict: Dictionary) {
  return (key: string, fallback?: string) => translate(dict, key, fallback);
}
