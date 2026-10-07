import { z } from "zod";
import { cookies } from "next/headers";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recordPageView } from "@/server/analytics";

const bodySchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).nullable().optional(),
});

const COOKIE = "galaxy_vid";

function newVisitorKey() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`pageview:${clientIp(request)}`, { limit: 60, windowMs: 60_000 }).ok) {
      return jsonOk({ ok: false, skipped: true });
    }
    const body = bodySchema.parse(await request.json());
    const jar = await cookies();
    let visitorKey = jar.get(COOKIE)?.value ?? null;
    const isNew = !visitorKey;
    if (!visitorKey) visitorKey = newVisitorKey();

    const result = await recordPageView({
      path: body.path,
      referrer: body.referrer ?? null,
      visitorKey,
    });

    const res = jsonOk({ ok: true, skipped: result.skipped });
    if (isNew && visitorKey) {
      res.cookies.set(COOKIE, visitorKey, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonOk({ ok: false, skipped: true });
    console.error(err);
    return jsonOk({ ok: false, skipped: true });
  }
}
