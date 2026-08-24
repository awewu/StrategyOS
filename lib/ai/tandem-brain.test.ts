import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { askTandem, tandemAiEnabled } from "./tandem-brain";

const realFetch = globalThis.fetch;
const saved = {
  use: process.env.STRATOS_USE_TANDEM_AI,
  base: process.env.TANDEM_AI_BASE_URL,
  issuer: process.env.TANDEM_ISSUER,
  token: process.env.TANDEM_AI_TOKEN,
  key: process.env.STRATOS_LLM_API_KEY,
  openai: process.env.OPENAI_API_KEY,
};

function restore(name: string, val: string | undefined) {
  if (val === undefined) delete process.env[name];
  else process.env[name] = val;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  restore("STRATOS_USE_TANDEM_AI", saved.use);
  restore("TANDEM_AI_BASE_URL", saved.base);
  restore("TANDEM_ISSUER", saved.issuer);
  restore("TANDEM_AI_TOKEN", saved.token);
  restore("STRATOS_LLM_API_KEY", saved.key);
  restore("OPENAI_API_KEY", saved.openai);
});

const input = { scenario: "reasoning_complex" as const, system: "sys", user: "u" };

describe("tandemAiEnabled", () => {
  it("only true when STRATOS_USE_TANDEM_AI=1", () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    assert.equal(tandemAiEnabled(), true);
    process.env.STRATOS_USE_TANDEM_AI = "0";
    assert.equal(tandemAiEnabled(), false);
    delete process.env.STRATOS_USE_TANDEM_AI;
    assert.equal(tandemAiEnabled(), false);
  });
});

describe("askTandem", () => {
  it("disabled + no local LLM key → source 'disabled'", async () => {
    delete process.env.STRATOS_USE_TANDEM_AI;
    delete process.env.STRATOS_LLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const res = await askTandem(input);
    assert.equal(res.source, "disabled");
    assert.equal(res.ok, false);
  });

  it("disabled + local key → falls back to direct", async () => {
    delete process.env.STRATOS_USE_TANDEM_AI;
    process.env.STRATOS_LLM_API_KEY = "k";
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "direct-answer" } }] }),
    })) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "fallback");
    assert.equal(res.content, "direct-answer");
  });

  it("enabled + base+token + governed ok → source 'tandem'", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    globalThis.fetch = (async (url: string) => {
      assert.ok(String(url).endsWith("/api/ai/governed-chat"));
      return { ok: true, status: 200, json: async () => ({ ok: true, answer: "governed", model: "deepseek" }) };
    }) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "tandem");
    assert.equal(res.content, "governed");
    assert.equal(res.model, "deepseek");
  });

  it("enabled + governance blocked → blocked true, no fallback", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, blocked: true }),
    })) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "tandem");
    assert.equal(res.blocked, true);
    assert.equal(res.ok, false);
  });

  it("enabled but endpoint unreachable → fail-soft fallback to direct", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    process.env.STRATOS_LLM_API_KEY = "k";
    let call = 0;
    globalThis.fetch = (async () => {
      call += 1;
      if (call === 1) throw new Error("tandem down"); // governed-chat
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "fell-back" } }] }) };
    }) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "fallback");
    assert.equal(res.content, "fell-back");
  });
});
