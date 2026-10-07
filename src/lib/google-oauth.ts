import { SignJWT, jwtVerify } from "jose";
import { getAppUrl } from "@/lib/stripe";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Brak GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET w .env.",
    );
  }
  return { clientId, clientSecret };
}

export function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI?.replace(/\/$/, "") ||
    `${getAppUrl()}/api/auth/google/callback`
  );
}

function stateSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Brak AUTH_SECRET.");
  return new TextEncoder().encode(secret);
}

export async function createGoogleOAuthState() {
  return new SignJWT({ purpose: "google_oauth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(stateSecret());
}

export async function verifyGoogleOAuthState(state: string) {
  try {
    const { payload } = await jwtVerify(state, stateSecret());
    return payload.purpose === "google_oauth";
  } catch {
    return false;
  }
}

export function buildGoogleAuthUrl(state: string) {
  const { clientId } = getGoogleClient();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = getGoogleClient();

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        "Nie udało się wymienić kodu Google.",
    );
  }

  const profileRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json()) as GoogleProfile & {
    error?: string;
  };

  if (!profileRes.ok || !profile.sub || !profile.email) {
    throw new Error(profile.error || "Nie udało się pobrać profilu Google.");
  }

  return {
    sub: profile.sub,
    email: profile.email.toLowerCase(),
    email_verified: profile.email_verified,
    name: profile.name,
  };
}
