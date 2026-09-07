/** @type {import('next').NextConfig} */

// In production the Next server proxies /api/v1/* to the backend so the browser
// talks to a single origin (clean SSE, no CORS). Locally it targets :8000.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:8000";

const nextConfig = {
  // "standalone" is for the Docker image / self-hosting. On Vercel (VERCEL=1)
  // leave it unset so Vercel's native Next.js adapter handles the build.
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_PROXY_TARGET}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
