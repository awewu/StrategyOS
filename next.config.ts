import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse"],
  // Dashboard pages are force-dynamic; allow slower static routes (print/login) if needed.
  staticPageGenerationTimeout: 120,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    // proxy.ts buffers request bodies; default 10MB truncates large strategy PDFs.
    // Raised to 100MB so report import (11-agent trigger) can parse files up to 100MB.
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
