import type { NextConfig } from "next";

// Clerk needs to load JS, hit its API, and pop iframes for SSO/MFA. Vercel
// Live Insights needs vercel-insights endpoints. Everything else stays
// locked down.
const CLERK_HOSTS = "https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://clerk-telemetry.com";
const VERCEL_INSIGHTS = "https://vercel.live https://*.pusher.com wss://*.pusher.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${CLERK_HOSTS} ${VERCEL_INSIGHTS}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: https: ${CLERK_HOSTS}`,
      `connect-src 'self' ${CLERK_HOSTS} ${VERCEL_INSIGHTS} https://www.who.int https://data.cdc.gov https://www.cdc.gov https://en.wikipedia.org https://wikimedia.org https://www.ebi.ac.uk https://api.biorxiv.org https://api.gbif.org https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com`,
      `frame-src 'self' ${CLERK_HOSTS}`,
      "worker-src 'self' blob:",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default config;
