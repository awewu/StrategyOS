/**
 * Tandem OIDC SSO (ai.rhautt.com) — Authorization Code + PKCE.
 *
 * Standard OpenID Connect IdP. We auto-discover endpoints from the issuer,
 * verify the RS256 `id_token` against the published JWKS (Node `crypto`,
 * no external dependency), then pull org-structure claims from `/userinfo`.
 *
 * Mirrors the WorkOS provider in `lib/auth/workos.ts`: env-gated, syncs the
 * user into Prisma on login, falls back to a derived session when the DB is
 * unavailable.
 */
import crypto from "crypto";
import { dbAvailable, prisma } from "@/lib/db";
import { DEMO_USERS, type SessionPayload } from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";

export const TANDEM_STATE_COOKIE = "stratos_tandem_state";

/** Default issuer; overridable via env for staging/testing. */
export function tandemIssuer(): string {
  return (process.env.TANDEM_ISSUER?.trim() || "https://ai.rhautt.com").replace(/\/+$/, "");
}

export function tandemRedirectUri(origin: string): string {
  return process.env.TANDEM_REDIRECT_URI ?? `${origin}/api/auth/tandem/callback`;
}

export function tandemScopes(): string {
  return process.env.TANDEM_SCOPES?.trim() || "openid profile email roles org";
}

// ── Discovery + JWKS (cached in-process) ────────────────────────────────────

interface OidcDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

let discoveryCache: { value: OidcDiscovery; expires: number } | null = null;
let jwksCache: { keys: crypto.JsonWebKey[]; expires: number } | null = null;

function defaultDiscovery(): OidcDiscovery {
  const iss = tandemIssuer();
  return {
    issuer: iss,
    authorization_endpoint: `${iss}/api/oidc/authorize`,
    token_endpoint: `${iss}/api/oidc/token`,
    userinfo_endpoint: `${iss}/api/oidc/userinfo`,
    jwks_uri: `${iss}/.well-known/jwks.json`,
    end_session_endpoint: `${iss}/api/oidc/logout`,
  };
}

export async function tandemDiscovery(): Promise<OidcDiscovery> {
  if (discoveryCache && discoveryCache.expires > Date.now()) return discoveryCache.value;
  try {
    const res = await fetch(`${tandemIssuer()}/.well-known/openid-configuration`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const value = (await res.json()) as OidcDiscovery;
      discoveryCache = { value, expires: Date.now() + 60 * 60 * 1000 };
      return value;
    }
  } catch (err) {
    console.error("Tandem discovery failed, using defaults:", (err as Error).message);
  }
  const fallback = defaultDiscovery();
  discoveryCache = { value: fallback, expires: Date.now() + 5 * 60 * 1000 };
  return fallback;
}

async function fetchJwks(jwksUri: string): Promise<crypto.JsonWebKey[]> {
  if (jwksCache && jwksCache.expires > Date.now()) return jwksCache.keys;
  const res = await fetch(jwksUri, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const data = (await res.json()) as { keys: crypto.JsonWebKey[] };
  jwksCache = { keys: data.keys ?? [], expires: Date.now() + 60 * 60 * 1000 };
  return jwksCache.keys;
}

// ── PKCE + authorize URL ─────────────────────────────────────────────────────

export interface TandemAuthState {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
}

function randomString(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function buildTandemAuthorizeUrl(
  origin: string,
  next = "/command",
): Promise<{ url: string; state: TandemAuthState } | null> {
  const clientId = process.env.TANDEM_CLIENT_ID;
  if (!clientId) return null;

  const discovery = await tandemDiscovery();
  const verifier = randomString(48);
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const state: TandemAuthState = {
    state: randomString(),
    nonce: randomString(),
    verifier,
    next: next.startsWith("/") ? next : "/command",
  };

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: tandemRedirectUri(origin),
    scope: tandemScopes(),
    state: state.state,
    nonce: state.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return { url: `${discovery.authorization_endpoint}?${params.toString()}`, state };
}

/** Pack/unpack the transient auth state into a single httpOnly cookie. */
export function encodeTandemState(state: TandemAuthState): string {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function decodeTandemState(value: string | undefined): TandemAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as TandemAuthState;
    if (!parsed.state || !parsed.verifier) return null;
    if (!parsed.next?.startsWith("/")) parsed.next = "/command";
    return parsed;
  } catch {
    return null;
  }
}

// ── id_token verification (RS256 via JWKS, Node crypto) ──────────────────────

export interface TandemClaims {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  job_title?: string;
  roles?: string[];
  tenant?: string;
  department?: string;
  department_id?: string;
  department_path?: string;
  manager_id?: string;
  manager_name?: string;
  employee_id?: string;
  [key: string]: unknown;
}

function decodeJwtSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
}

export async function verifyIdToken(
  idToken: string,
  expectedNonce: string,
): Promise<TandemClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("id_token malformed");
  const [headerB64, payloadB64, sigB64] = parts;

  const header = decodeJwtSegment<{ alg: string; kid?: string }>(headerB64);
  if (header.alg !== "RS256") throw new Error(`unsupported alg: ${header.alg}`);

  const discovery = await tandemDiscovery();
  const keys = await fetchJwks(discovery.jwks_uri);
  const jwk =
    keys.find((k) => (k as { kid?: string }).kid === header.kid) ?? (keys.length === 1 ? keys[0] : undefined);
  if (!jwk) throw new Error("no matching JWKS key");

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const verified = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${headerB64}.${payloadB64}`),
    publicKey,
    Buffer.from(sigB64, "base64url"),
  );
  if (!verified) throw new Error("id_token signature invalid");

  const claims = decodeJwtSegment<TandemClaims & { iss?: string; aud?: string | string[]; exp?: number; nonce?: string }>(
    payloadB64,
  );

  if (claims.iss !== discovery.issuer) throw new Error(`iss mismatch: ${claims.iss}`);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(process.env.TANDEM_CLIENT_ID)) throw new Error("aud mismatch");
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) throw new Error("id_token expired");
  if (claims.nonce !== expectedNonce) throw new Error("nonce mismatch");

  return claims;
}

// ── Token exchange + userinfo → SessionPayload ───────────────────────────────

export async function exchangeTandemCode(
  code: string,
  origin: string,
  auth: TandemAuthState,
): Promise<SessionPayload | null> {
  const clientId = process.env.TANDEM_CLIENT_ID;
  const clientSecret = process.env.TANDEM_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const discovery = await tandemDiscovery();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: tandemRedirectUri(origin),
    code_verifier: auth.verifier,
  });

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    console.error("Tandem token exchange failed:", tokenRes.status, errText.slice(0, 200));
    return null;
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!tokens.id_token || !tokens.access_token) {
    console.error("Tandem token response missing id_token/access_token");
    return null;
  }

  let claims: TandemClaims;
  try {
    claims = await verifyIdToken(tokens.id_token, auth.nonce);
  } catch (err) {
    console.error("Tandem id_token verification failed:", (err as Error).message);
    return null;
  }

  // Enrich with userinfo (org structure) — best effort.
  try {
    const uiRes = await fetch(discovery.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (uiRes.ok) {
      const info = (await uiRes.json()) as TandemClaims;
      claims = { ...claims, ...info };
    }
  } catch (err) {
    console.error("Tandem userinfo fetch failed:", (err as Error).message);
  }

  return syncTandemUser(claims);
}

export async function syncTandemUser(claims: TandemClaims): Promise<SessionPayload> {
  const email = (claims.email ?? `${claims.sub}@tandem.local`).toLowerCase();
  const name = claims.name || claims.preferred_username || email;
  const role = mapTandemRole(claims.roles);

  if (await dbAvailable()) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        userId: existing.id,
        email: existing.email,
        name: existing.name,
        role: existing.role as RoleKey,
        orgUnitId: existing.orgUnitId,
        projectCode: existing.projectCode,
      };
    }

    const created = await prisma.user.create({
      data: { email, name: name.slice(0, 50), role },
    });
    return {
      userId: created.id,
      email: created.email,
      name: created.name,
      role: created.role as RoleKey,
      orgUnitId: created.orgUnitId,
      projectCode: created.projectCode,
    };
  }

  const demo = DEMO_USERS.find((u) => u.email === email);
  if (demo) return demo;

  return { userId: claims.sub, email, name, role, orgUnitId: null, projectCode: null };
}

/**
 * Map Tandem roles (owner/admin/manager/employee/steward/champion/finance/…)
 * to StratOS RoleKeys. Highest-privilege match wins; default observer.
 */
export function mapTandemRole(roles: string[] | undefined): RoleKey {
  const set = new Set((roles ?? []).map((r) => r.toLowerCase()));
  if (set.has("owner") || set.has("admin")) return "ceo";
  if (set.has("finance")) return "cfo";
  if (set.has("manager")) return "vp";
  if (set.has("steward") || set.has("champion")) return "system_head";
  if (set.has("employee")) return "staff";
  return "observer";
}

export async function tandemEndSessionUrl(
  postLogoutRedirectUri?: string,
  idTokenHint?: string,
): Promise<string | null> {
  const discovery = await tandemDiscovery();
  if (!discovery.end_session_endpoint) return null;
  const params = new URLSearchParams();
  if (postLogoutRedirectUri) params.set("post_logout_redirect_uri", postLogoutRedirectUri);
  if (idTokenHint) params.set("id_token_hint", idTokenHint);
  const qs = params.toString();
  return qs ? `${discovery.end_session_endpoint}?${qs}` : discovery.end_session_endpoint;
}
