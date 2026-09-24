/**
 * Bangladeshi mobile number validation.
 * Accepts: 01XXXXXXXXX (11 digits), 8801XXXXXXXXX, +8801XXXXXXXXX.
 * Operator prefix must be 013–019. Spaces and dashes are ignored.
 */
export function normalizePhone(v: string): string {
  return v.replace(/[\s-]/g, "");
}

export function isBdPhone(v: string): boolean {
  return /^(?:\+?8801|01)[3-9]\d{8}$/.test(normalizePhone(v));
}

export function isBangladesh(country: string | null | undefined): boolean {
  return (country ?? "").trim().toLowerCase() === "bangladesh";
}

/** Split a store phone field that may hold several numbers ("017…, 019…"). */
export function splitPhones(phone?: string | null): string[] {
  return (phone ?? "")
    .split(/[,/|]/)
    .map((p) => p.trim())
    .filter(Boolean);
}
