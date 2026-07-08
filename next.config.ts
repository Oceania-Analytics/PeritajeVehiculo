import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * These mitigate common web vulnerabilities:
 * - XSS (Content-Security-Policy)
 * - Clickjacking (X-Frame-Options, frame-ancestors CSP)
 * - MIME sniffing (X-Content-Type-Options)
 * - Information leakage (X-Powered-By removed by Next.js)
 * - HTTPS enforcement (Strict-Transport-Security)
 * - Referrer leakage (Referrer-Policy)
 * - Browser feature abuse (Permissions-Policy)
 */
const securityHeaders = [
  // Prevent browsers from guessing MIME types — stops MIME-confusion attacks
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevent clickjacking — disallow embedding in any iframe
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Control referrer information sent with requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable unnecessary browser features to reduce attack surface
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Enforce HTTPS for 1 year (only effective in production with HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Content Security Policy — restrict resource origins to prevent XSS
  // Allows: same-origin scripts, Google Fonts, self images, no inline scripts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Allow Next.js inline scripts required for hydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      // Backend API endpoint for image analysis
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Configured for Plesk subdirectory deployment
  basePath: "/demo/peritaje",
  
  // Enable standalone mode for Docker — bundles only what's needed to run
  output: "standalone",

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Remove the X-Powered-By header to avoid disclosing technology stack
  poweredByHeader: false,

  // Strict mode for React — helps catch bugs early
  reactStrictMode: true,

  trailingSlash: true,
};

export default nextConfig;
