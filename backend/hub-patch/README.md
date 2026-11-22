# Hub-side patch: Fitness Club auth bridge (v2, post security review)

Additive files only; one new migration; no edits to existing Hub files.

## Files
- `src/app/fitness/connect/page.tsx` — consent page. Takes `?state=` only.
  Redirect target is never caller-supplied; it is fetched from
  `/api/fitness/connect-target` which returns env `FITNESS_APP_ORIGIN`
  (allowlist of exactly one origin). If the Hub session is missing (grant
  returns 401) the page tells the user to sign in at the Hub and come back —
  Hub login currently ignores `next`, so no next-param bounce is used.
- `src/app/api/fitness/grant/route.ts` — POST {state}. Requires Hub session.
  Validates state shape, records a random nonce in `fitness_link_nonces`,
  mints an HMAC-SHA256 code over {aud:"fitness-club", nonce, state,
  hub_user_id, name, email, exp:5min} with env `FITNESS_LINK_SECRET`.
- `src/app/api/fitness/consume/route.ts` — POST {code} (server-to-server).
  Verifies signature + audience + expiry, then atomically marks the nonce
  consumed (`UPDATE ... WHERE consumed_at IS NULL RETURNING`) — a code is
  valid exactly once. Returns identity + state.
- `src/app/api/fitness/connect-target/route.ts` — GET, returns the
  allowlisted Fitness origin from env.
- `migrations/0014_fitness_link_nonces.sql` — nonce table. Renumber to the
  next free slot at merge time.

## Flow
1. Fitness `/login` creates a random `state`, stores it in a signed cookie,
   and links to `{HUB_URL}/fitness/connect?state=...`.
2. Hub connect page → grant → code; redirects to
   `{FITNESS_APP_ORIGIN}/api/auth/hub/callback?code&state`.
3. Fitness callback checks `state` against its cookie, verifies the code
   signature + audience locally, then POSTs the code to Hub `/consume`
   (one-time enforcement), then creates the local session.

## Env on the Hub
- `FITNESS_LINK_SECRET` — shared with the Fitness app (vault: "Fitness Club
  FITNESS_LINK_SECRET").
- `FITNESS_APP_ORIGIN` — exact deployed Fitness origin, e.g.
  `https://fitness-club-xyz.vercel.app`. No path, no trailing slash.

## Env on the Fitness app
- `FITNESS_LINK_SECRET` (same value), `HUB_URL`, `FITNESS_APP_URL` (same as
  Hub's `FITNESS_APP_ORIGIN`), `FITNESS_SESSION_SECRET`, `DATABASE_URL`.

Verified against the Hub tree at e22b9d5: `@/lib/auth` exports `auth` and
`auth.api.getSession({ headers: await headers() })` matches Hub usage in
`src/lib/session.ts`; `@/db` exports the drizzle `db`.
