"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "shino:search-history";
const MAX_ENTRIES = 30;
const POPULAR_LIMIT = 6;

interface HistoryEntry {
  /** Display term as the user typed it (last casing wins). */
  term: string;
  count: number;
  lastAt: number;
}

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full / disabled — non-fatal
  }
}

/**
 * Local search history persisted in localStorage. `popular` is the history ranked
 * by frequency (then recency) — shown when the search box is focused but empty.
 * SSR-safe: reads happen in effects, never during render.
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Hydrate after mount to avoid SSR/client markup mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading from localStorage post-hydration
    setHistory(read());
  }, []);

  const add = useCallback((rawTerm: string) => {
    const term = rawTerm.trim();
    if (!term) return;
    const key = term.toLowerCase();
    setHistory((prev) => {
      const existing = prev.find((e) => e.term.toLowerCase() === key);
      const next = existing
        ? prev.map((e) =>
            e.term.toLowerCase() === key
              ? { term, count: e.count + 1, lastAt: Date.now() }
              : e
          )
        : [...prev, { term, count: 1, lastAt: Date.now() }];
      // Keep the most recent MAX_ENTRIES to bound storage.
      const trimmed = [...next]
        .sort((a, b) => b.lastAt - a.lastAt)
        .slice(0, MAX_ENTRIES);
      write(trimmed);
      return trimmed;
    });
  }, []);

  const remove = useCallback((rawTerm: string) => {
    const key = rawTerm.trim().toLowerCase();
    setHistory((prev) => {
      const next = prev.filter((e) => e.term.toLowerCase() !== key);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setHistory([]);
  }, []);

  const popular = [...history]
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
    .slice(0, POPULAR_LIMIT)
    .map((e) => e.term);

  return { history, popular, add, remove, clear };
}
