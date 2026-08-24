import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  askTandem,
  tandemAiEnabled,
  tandemStrictMode,
  onTandemBypass,
  type TandemBypassEvent,
} from "./tandem-brain";

const realFetch = globalThis.fetch;
const saved = {
  use: process.env.STRATOS_USE_TANDEM_AI,
  base: process.env.TANDEM_AI_BASE_URL,
  issuer: process.env.TANDEM_ISSUER,
  token: process.env.TANDEM_AI_TOKEN,
  key: process.env.STRATOS_LLM_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  strict: process.env.STRATOS_TANDEM_STRICT,
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
  restore("STRATOS_TANDEM_STRICT", saved.strict);
  onTandemBypass(null);
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
    globalThis.fetch = (async (url: string, init?: { body?: string }) => {
      assert.ok(String(url).endsWith("/api/gateway/ai-chat"));
      const sent = JSON.parse(String(init?.body ?? "{}")) as {
        intent?: string;
        messages?: { role: string; content: string }[];
      };
      // Gateway contract: intent required, messages user/assistant only (no system role).
      assert.ok(sent.intent && sent.intent.length > 0);
      assert.deepEqual(
        sent.messages?.map((m) => m.role),
        ["user"],
      );
      assert.ok(sent.messages?.[0]?.content.includes("sys")); // system folded into user
      return { ok: true, status: 200, json: async () => ({ ok: true, answer: "governed", usage: { model: "deepseek" } }) };
    }) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "tandem");
    assert.equal(res.content, "governed");
    assert.equal(res.model, "deepseek");
  });

  it("enabled + governance blocked (HTTP 403) → blocked true, no fallback", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    process.env.STRATOS_LLM_API_KEY = "k"; // present, but blocked must NOT fall back
    globalThis.fetch = (async () => ({
      ok: false,
      status: 403,
      json: async () => ({ ok: false, blocked: { stage: "output", reasons: ["L0"] } }),
    })) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "tandem");
    assert.equal(res.blocked, true);
    assert.equal(res.ok, false);
  });

  it("enabled + governance blocked (200 body) → blocked true, no fallback", async () => {
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

describe("tandemStrictMode (fail-closed)", () => {
  it("only true when STRATOS_TANDEM_STRICT=1", () => {
    process.env.STRATOS_TANDEM_STRICT = "1";
    assert.equal(tandemStrictMode(), true);
    delete process.env.STRATOS_TANDEM_STRICT;
    assert.equal(tandemStrictMode(), false);
  });

  it("strict + endpoint unreachable → source 'unavailable', NO fallback", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.STRATOS_TANDEM_STRICT = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    process.env.STRATOS_LLM_API_KEY = "k"; // present, but must NOT be used
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new Error("tandem down");
    }) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.source, "unavailable");
    assert.equal(res.ok, false);
    assert.equal(calls, 1); // governed-chat attempted once, no direct fallback call
  });

  it("strict + unconfigured → 'unavailable', not 'fallback'", async () => {
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.STRATOS_TANDEM_STRICT = "1";
    delete process.env.TANDEM_AI_BASE_URL;
    delete process.env.TANDEM_ISSUER;
    delete process.env.TANDEM_AI_TOKEN;
    process.env.STRATOS_LLM_API_KEY = "k";
    const res = await askTandem(input);
    assert.equal(res.source, "unavailable");
  });
});

describe("onTandemBypass (observability)", () => {
  it("records reason + strict flag on every bypass path", async () => {
    const events: TandemBypassEvent[] = [];
    onTandemBypass((e) => events.push(e));
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    process.env.STRATOS_LLM_API_KEY = "k";
    delete process.env.STRATOS_TANDEM_STRICT;
    let call = 0;
    globalThis.fetch = (async () => {
      call += 1;
      if (call === 1) return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "x" } }] }) };
    }) as unknown as typeof fetch;
    await askTandem(input);
    assert.equal(events.length, 1);
    assert.equal(events[0]!.reason, "non_2xx");
    assert.equal(events[0]!.strict, false);
    assert.equal(events[0]!.scenario, "reasoning_complex");
  });

  it("records 'blocked' when governance blocks", async () => {
    const events: TandemBypassEvent[] = [];
    onTandemBypass((e) => events.push(e));
    process.env.STRATOS_USE_TANDEM_AI = "1";
    process.env.TANDEM_AI_BASE_URL = "https://ai.rhautt.com";
    process.env.TANDEM_AI_TOKEN = "svc-token";
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, blocked: true }),
    })) as unknown as typeof fetch;
    await askTandem(input);
    assert.equal(events.length, 1);
    assert.equal(events[0]!.reason, "blocked");
  });

  it("listener throwing never breaks the main flow", async () => {
    onTandemBypass(() => {
      throw new Error("audit sink down");
    });
    delete process.env.STRATOS_USE_TANDEM_AI;
    process.env.STRATOS_LLM_API_KEY = "k";
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    })) as unknown as typeof fetch;
    const res = await askTandem(input);
    assert.equal(res.content, "ok");
  });
});
