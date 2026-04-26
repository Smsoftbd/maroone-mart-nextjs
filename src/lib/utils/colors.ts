function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean.slice(0, 6);
  if (full.length !== 6) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  let r: number, g: number, b: number;
  if (sn === 0) {
    r = g = b = ln;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(hex: string, delta: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [h, s, l] = rgbToHsl(...rgb);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

export function buildColorStyleBlock(colors: {
  primary: string;
  primary_text: string;
  secondary: string;
  secondary_text: string;
  tertiary: string;
  tertiary_text: string;
  default_text: string;
}): string {
  const { primary, primary_text, secondary, secondary_text, tertiary, tertiary_text, default_text } = colors;
  const vars: Record<string, string> = {
    "--color-brand-50": tertiary,
    "--color-brand-100": adjustLightness(tertiary, -5),
    "--color-brand-400": secondary,
    "--color-brand-500": primary,
    "--color-brand-600": adjustLightness(primary, -10),
    "--color-brand-900": adjustLightness(primary, -35),
    "--color-text-primary": default_text,
    "--color-primary-text": primary_text,
    "--color-secondary-text": secondary_text,
    "--color-tertiary-text": tertiary_text,
  };
  const block = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `:root{${block}}`;
}
