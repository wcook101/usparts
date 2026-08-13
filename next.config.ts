import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow LAN access to the dev server from other machines on your network
  allowedDevOrigins: ["192.168.1.153", "localhost", "127.0.0.1"],

  async redirects() {
    return [
      {
        // www is the only hostname that may serve this site. The apex exists solely to
        // redirect to it, and today that redirect happens upstream at the DNS host -- but
        // upstream config is invisible from this repo and can be changed by anyone with a
        // hosting login. This makes the rule enforce itself: if the apex is ever pointed at
        // the app, it answers 301 instead of quietly serving a duplicate of every page under
        // a second hostname, which is the split-signal problem the www-only decision exists
        // to avoid. Costs nothing when the host is already correct.
        source: "/:path*",
        has: [{ type: "host", value: "usparts.us" }],
        destination: "https://www.usparts.us/:path*",
        // 301 rather than Next's default 308: both are permanent to Google, but 301 is what
        // every SEO tool and audit checks for, and this redirect exists for their benefit.
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
