import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { verifyWorkOSWebhook } from "./workos-webhook";

function signPayload(payload: string, secret: string, ts?: number): string {
  const t = ts ?? Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

describe("verifyWorkOSWebhook", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_1", event: "dsync.user.created", data: {} });

  it("accepts valid signature", () => {
    const sig = signPayload(payload, secret);
    assert.equal(verifyWorkOSWebhook(payload, sig, secret), true);
  });

  it("rejects tampered payload", () => {
    const sig = signPayload(payload, secret);
    assert.equal(verifyWorkOSWebhook(payload + "x", sig, secret), false);
  });

  it("rejects stale timestamp", () => {
    const oldTs = Math.floor(Date.now() / 1000) - 600;
    const sig = signPayload(payload, secret, oldTs);
    assert.equal(verifyWorkOSWebhook(payload, sig, secret, 300), false);
  });

  it("rejects missing signature header", () => {
    assert.equal(verifyWorkOSWebhook(payload, null, secret), false);
  });
});
