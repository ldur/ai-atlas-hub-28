export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/** Constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

/** Verify a plaintext code against a stored `pbkdf2$sha256$iterations$saltHex$hashHex` string. */
export async function verifyPassword(code: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = parseInt(parts[2], 10);
  const salt = fromHex(parts[3]);
  const expected = parts[4];

  const key = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return timingSafeEqual(toHex(bits), expected);
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Create a signed, time-limited admin session token. */
export async function createSessionToken(secret: string): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const payload = `${expiresAt}.${nonce}`;
  const sig = await hmac(secret, payload);
  return { token: `${payload}.${sig}`, expiresAt };
}

/** Validate an admin session token. Returns true when signed and unexpired. */
export async function verifySessionToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const secret = Deno.env.get("ADMIN_SESSION_SECRET");
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const expected = await hmac(secret, `${expStr}.${nonce}`);
  if (!timingSafeEqual(sig, expected)) return false;
  const exp = parseInt(expStr, 10);
  return Number.isFinite(exp) && Date.now() < exp;
}

/** Hash a client IP so raw addresses are never stored. */
export async function hashIp(req: Request): Promise<string> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const secret = Deno.env.get("ADMIN_SESSION_SECRET") ?? "";
  return await hmac(secret, `ip:${ip}`);
}

export function unauthorized(message = "Uautorisert. Logg inn som admin på nytt.") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
