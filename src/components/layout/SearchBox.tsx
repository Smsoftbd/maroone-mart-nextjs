"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Loader2, ArrowUpRight } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/useDebounce";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { resolveL10n, type LocalizedString } from "@/lib/utils/l10n";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/lib/api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 6;

interface Suggestion {
  slug: string;
  name: string;
  image: string | null;
  price: number;
}

interface SearchBoxProps {
  categories: Category[];
  currency: string;
  autoFocus?: boolean;
  /** Called after a search commits — mobile uses it to close the collapsible bar. */
  onNavigate?: () => void;
  className?: string;
}

interface RawBarcode {
  is_active?: boolean;
  effective_price?: number;
}
interface RawProduct {
  slug: string;
  name: LocalizedString | string;
  image?: string | null;
  barcodes?: RawBarcode[];
}

function toSuggestion(p: RawProduct): Suggestion {
  const barcodes = Array.isArray(p.barcodes) ? p.barcodes : [];
  const active = barcodes.find((b) => b.is_active) ?? barcodes[0];
  return {
    slug: p.slug,
    name: resolveL10n(p.name),
    image: p.image ?? null,
    price: Math.max(active?.effective_price ?? 0, 0),
  };
}

export function SearchBox({
  categories,
  currency,
  autoFocus,
  onNavigate,
  className,
}: SearchBoxProps) {
  const router = useRouter();
  const { popular, add, clear, history } = useSearchHistory();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1); // highlighted item index

  const debounced = useDebouncedValue(query.trim(), 250);
  const isTyping = debounced.length >= MIN_CHARS;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular terms shown when empty; fall back to top category names for first-time
  // visitors so the panel is never blank.
  const popularTerms = useMemo(() => {
    if (popular.length > 0) return popular;
    return categories.slice(0, 6).map((c) => c.name);
  }, [popular, categories]);

  // Fetch product suggestions (aborting stale requests) while typing.
  useEffect(() => {
    if (!isTyping) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing results when query is too short
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(
      `${BASE_URL}/products?search=${encodeURIComponent(debounced)}&per_page=${MAX_SUGGESTIONS}`,
      { headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" }, signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        setSuggestions((Array.isArray(data.data) ? data.data : []).map(toSuggestion));
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, isTyping]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const runSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    add(t);
    setQuery("");
    setOpen(false);
    onNavigate?.();
    router.push(`/products?search=${encodeURIComponent(t)}`);
  };

  const goToProduct = (slug: string, term: string) => {
    add(term.trim() || slug);
    setQuery("");
    setOpen(false);
    onNavigate?.();
    router.push(`/products/${slug}`);
  };

  // Flat list of highlightable items for keyboard nav.
  // Typing mode: [...products, "see all"]. Empty mode: [...popularTerms].
  const itemCount = isTyping ? suggestions.length + 1 : popularTerms.length;

  const activateItem = (idx: number) => {
    if (isTyping) {
      if (idx < suggestions.length) {
        const s = suggestions[idx];
        goToProduct(s.slug, s.name);
      } else {
        runSearch(debounced);
      }
    } else {
      const term = popularTerms[idx];
      if (term) runSearch(term);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" && itemCount > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % itemCount);
      return;
    }
    if (e.key === "ArrowUp" && itemCount > 0) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? itemCount - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < itemCount) activateItem(active);
      else runSearch(query);
    }
  };

  const showPanel = open;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div
        className="relative"
        role="combobox"
        aria-expanded={showPanel}
        aria-haspopup="listbox"
        aria-controls="searchbox-listbox"
      >
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          autoComplete="off"
          aria-label="Search products"
          className="w-full rounded-full bg-white text-gray-900 placeholder:text-gray-400 pl-5 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="button"
          onClick={() => runSearch(query)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-brand-500 hover:bg-brand-50 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {showPanel && (
        <div
          id="searchbox-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto bg-white text-gray-900 rounded-xl shadow-lg border border-[var(--color-border)]"
        >
          {isTyping ? (
            <>
              {loading && suggestions.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--color-text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
                  No matches for &ldquo;{debounced}&rdquo;
                </div>
              ) : (
                <ul className="py-1.5">
                  {suggestions.map((s, i) => (
                    <li key={s.slug}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active === i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => goToProduct(s.slug, s.name)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                          active === i ? "bg-surface-100" : "hover:bg-surface-100"
                        )}
                      >
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-100">
                          {s.image && (
                            <Image
                              src={s.image}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                        {s.price > 0 && (
                          <span className="shrink-0 text-sm font-semibold text-brand-500">
                            {formatPrice(s.price, currency)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                role="option"
                aria-selected={active === suggestions.length}
                onMouseEnter={() => setActive(suggestions.length)}
                onClick={() => runSearch(debounced)}
                className={cn(
                  "flex w-full items-center gap-2 border-t border-[var(--color-border)] px-4 py-2.5 text-left text-sm font-medium text-brand-500 transition-colors",
                  active === suggestions.length ? "bg-brand-50" : "hover:bg-brand-50"
                )}
              >
                <Search className="h-4 w-4" />
                See all results for &ldquo;{debounced}&rdquo;
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </button>
            </>
          ) : popularTerms.length > 0 ? (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <TrendingUp className="h-3.5 w-3.5" /> Popular searches
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs text-[var(--color-text-muted)] hover:text-brand-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 px-4 pt-1.5 pb-1">
                {popularTerms.map((term, i) => (
                  <button
                    key={term}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => runSearch(term)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active === i
                        ? "border-brand-500 bg-brand-50 text-brand-500"
                        : "border-[var(--color-border)] hover:border-brand-500 hover:text-brand-500"
                    )}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Start typing to search products.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
