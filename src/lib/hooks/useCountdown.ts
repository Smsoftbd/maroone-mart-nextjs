"use client";

import { useSyncExternalStore } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};
// Whole seconds keep the snapshot stable between renders within the same second.
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
// Server/hydration snapshot: deterministic, so SSR and first client render match.
const getServerNow = () => null;

export function useCountdown(endsAt: string): CountdownResult {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  if (now === null) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false };

  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isExpired: false };
}
