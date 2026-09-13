/** @type {import('next').NextConfig} */

// In production the Next server proxies /api/v1/* to the backend so the browser
// talks to a single origin (clean SSE, no CORS). Locally it targets :8000.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:8000";

// script-src/style-src need 'unsafe-inline' for Next's inline hydration
// payload and the no-flash theme script in layout.tsx, and for the many
// inline `style={{...}}` attributes across the app — a nonce-based strict
// CSP would need middleware wiring this app doesn't have. connect-src is
// 'self' only because the API is same-origin via the rewrite above, never
// called cross-origin from the browser.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  // "standalone" is only for the self-hosted Docker image (the Dockerfile sets
  // BUILD_STANDALONE=1). Everywhere else — Vercel, local dev — leave it unset so
  // the platform's own Next.js handling applies.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_PROXY_TARGET}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
