import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.FITNESS_LINK_SECRET = "test-link-secret-32-chars-minimum-xx";
process.env.FITNESS_SESSION_SECRET = "test-session-secret-32-chars-minxx";

import { mintHubGrant, verifyHubGrant } from "../src/lib/hub";
import { mintApiToken } from "../src/lib/api-auth";
import { verifySigned } from "../src/lib/crypto";





test("hub grant roundtrip", () => {
  const code = mintHubGrant({ nonce: "n1", state: "s1", hub_user_id: "u1", name: "طالب" });
  const g = verifyHubGrant(code);
  assert.equal(g?.hub_user_id, "u1");
  assert.equal(g?.iss, "student-hub-egypt");
  assert.equal(g?.aud, "fitness-club");
});

test("tampered signature rejected", () => {
  const code = mintHubGrant({ nonce: "n1", state: "s1", hub_user_id: "u1", name: "x" });
  const [payload] = code.split(".");
  assert.equal(verifyHubGrant(payload + ".AAAA"), null);
});

test("wrong audience rejected", () => {
  const g = verifyHubGrant(
    mintHubGrant({ nonce: "n", state: "s", hub_user_id: "u", name: "x" }),
  );
  assert.ok(g);
  const payload = Buffer.from(JSON.stringify({ ...g, aud: "other-app" })).toString("base64url");
  const sig = createHmac("sha256", "test-link-secret-32-chars-minimum-xx")
    .update(payload)
    .digest("base64url");
  assert.equal(verifyHubGrant(`${payload}.${sig}`), null);
});

test("expired grant rejected", () => {
  const code = mintHubGrant({ nonce: "n", state: "s", hub_user_id: "u", name: "x" }, -10);
  assert.equal(verifyHubGrant(code), null);
});

test("api token roundtrip + expiry", () => {
  const t = mintApiToken({ hub_user_id: "u1", name: "n", email: "e" });
  const p = verifySigned<{ hub_user_id: string; exp: number }>(
    t,
    "test-session-secret-32-chars-minxx",
  );
  assert.equal(p?.hub_user_id, "u1");
  assert.ok((p?.exp ?? 0) * 1000 > Date.now());
});
