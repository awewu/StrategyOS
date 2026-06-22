import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // proxy.ts buffers request bodies; default 10MB truncates large strategy PDFs
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
