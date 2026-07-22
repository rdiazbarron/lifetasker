/** @type {import('next').NextConfig} */
const nextConfig = {
  // Same-origin proxy to the NestJS API.
  //
  // In production the web app and API live on different hosts
  // (lifetasker-web.onrender.com vs lifetasker-api.onrender.com). The Better
  // Auth session cookie is host-scoped to the web app and — because
  // onrender.com is a public suffix — can NEVER be shared with the API host.
  // So a browser fetch straight to the API host arrives with no cookie and is
  // rejected (401), which drove a /login <-> /dashboard redirect loop.
  //
  // Fix: the browser calls the API under the web app's OWN origin
  // (/api/proxy/*, so the cookie is always sent), and Next.js forwards the
  // request — cookie header included — to the real API server-side. Set
  // NEXT_PUBLIC_API_URL=/api/proxy and API_PROXY_TARGET=<api-url>/api/v1.
  //
  // Only active when API_PROXY_TARGET is set, so local dev (which talks to the
  // API directly across localhost ports, where cookies ARE shared) is
  // unchanged.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
