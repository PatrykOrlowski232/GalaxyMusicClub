import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isDbUnavailable(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("DATABASE_URL") ||
    msg.includes("Access denied")
  );
}
