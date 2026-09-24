"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs`. The debounced value only updates once the
 * source has stayed unchanged for the full delay — cheap way to throttle
 * search-as-you-type without a helper lib.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
