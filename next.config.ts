import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/admin/backup": [
      "./app/**/*",
      "./components/**/*",
      "./lib/**/*",
      "./models/**/*",
      "./public/**/*",
      "./services/**/*",
      "./.gitignore",
      "./.vercelignore",
      "./eslint.config.mjs",
      "./middleware.ts",
      "./next.config.ts",
      "./package-lock.json",
      "./package.json",
      "./postcss.config.mjs",
      "./README.md",
      "./tsconfig.json",
      "./vercel.json",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://t.me https://telegram.me; connect-src 'self' https://t.me https://telegram.me; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; font-src 'self' data:; manifest-src 'self'; media-src 'self' https:; worker-src 'self' blob:; upgrade-insecure-requests",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
          {
            key: "Cache-Control",
            value: "private, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
