import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow LAN access to the dev server from other machines on your network
  allowedDevOrigins: ["192.168.1.153", "localhost", "127.0.0.1"],
};

export default nextConfig;
