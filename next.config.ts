import type { NextConfig } from "next";

/** Origin (scheme://host[:port]) of an env URL, or null. */
function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy, opt-in and read at build time:
 * - CSP_MODE           "off" (default) | "report-only" | "enforce"
 * - CSP_EXTRA_SOURCES  extra hosts for scripts/connections/frames, e.g. hosts
 *                      used by admin header/footer scripts or GTM custom tags
 * - CSP_REPORT_URI     optional violation report endpoint
 * Inline scripts ('unsafe-inline') stay allowed: the GTM/Pixel snippets and the
 * admin-editable header/footer scripts are inline. 'unsafe-eval' is needed by
 * GTM Custom JavaScript variables.
 */
function contentSecurityPolicy(): { key: string; value: string } | null {
  const mode = process.env.CSP_MODE?.trim().toLowerCase();
  if ((mode !== "report-only" && mode !== "enforce") || process.env.NODE_ENV !== "production") {
    return null;
  }
  const own = [
    originOf(process.env.GTM_SERVER_URL),
    originOf(process.env.NEXT_PUBLIC_API_BASE_URL),
  ].filter((o): o is string => !!o);
  const extra = (process.env.CSP_EXTRA_SOURCES ?? "").split(/[\s,]+/).filter(Boolean);
  const google = [
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.google.com",
    "https://*.doubleclick.net",
    "https://*.googleadservices.com",
    "https://*.gstatic.com",
  ];
  const meta = ["https://connect.facebook.net", "https://www.facebook.com"];
  const embeds = [
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://platform.twitter.com",
    "https://twitter.com",
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...google, ...meta, ...own, ...extra],
    "connect-src": ["'self'", ...google, ...meta, ...own, ...extra],
    "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
    "style-src": ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "frame-src": ["'self'", ...google, ...meta, ...embeds, ...own, ...extra],
    "media-src": ["'self'", "https:", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const reportUri = process.env.CSP_REPORT_URI?.trim();
  if (reportUri) directives["report-uri"] = [reportUri];

  return {
    key: mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: Object.entries(directives)
      .map(([k, v]) => `${k} ${[...new Set(v)].join(" ")}`)
      .join("; "),
  };
}

const csp = contentSecurityPolicy();

const nextConfig: NextConfig = {
  serverExternalPackages: ["sslcommerz-lts"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    dangerouslyAllowLocalIP: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(csp ? [csp] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
