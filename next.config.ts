import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dashboard pages are force-dynamic; allow slower static routes (print/login) if needed.
  staticPageGenerationTimeout: 120,
  experimental: {
    // proxy.ts buffers request bodies; default 10MB truncates large strategy PDFs
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
