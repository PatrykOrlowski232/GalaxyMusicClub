import { argon2id, argon2Verify } from "hash-wasm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountTypes, userAccountTypes, users } from "@/db/schema";

const COOKIE_NAME = "galaxy_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Brak AUTH_SECRET.");
  if (
    process.env.NODE_ENV === "production" &&
    (secret.length < 32 ||
      secret.includes("change-me") ||
      secret === "galaxy-dev-secret-change-me-in-production")
  ) {
    throw new Error(
      "AUTH_SECRET w produkcji musi być długim losowym sekretem (min. 32 znaki).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: "encoded",
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}

export type SessionUser = {
  id: number;
  email: string;
  roles: string[];
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: String(user.id),
    email: user.email,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!id) return null;
    return {
      id,
      email: String(payload.email ?? ""),
      roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
    };
  } catch {
    return null;
  }
}

export async function loadUserRoles(userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: accountTypes.name })
    .from(userAccountTypes)
    .innerJoin(accountTypes, eq(userAccountTypes.accountTypeId, accountTypes.id))
    .where(eq(userAccountTypes.userId, userId));
  return rows.map((r) => r.name);
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}

export const ROLE = {
  Admin: "Admin",
  Owner: "Owner",
  Promotor: "Promotor",
  Customer: "Customer",
  Barman: "Barman",
  Manager: "Manager",
} as const;
