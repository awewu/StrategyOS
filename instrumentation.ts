export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Standalone `server.js` does not load .env files; load them here so
    // self-hosted deploys read .env.production regardless of how the process
    // was launched. Existing process env vars take precedence (not overridden).
    const { loadEnvConfig } = await import("@next/env");
    loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

    const { validateProductionEnv } = await import("@/lib/env/validate");
    validateProductionEnv();
  }
}
