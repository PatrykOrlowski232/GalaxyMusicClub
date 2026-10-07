import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountTypes, auditLogs, userAccountTypes, users } from "@/db/schema";
import {
  createSession,
  getUserByEmail,
  hashPassword,
  loadUserRoles,
  ROLE,
} from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Hasło min. 8 znaków."),
  newsletter: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60_000 });
    if (!limited.ok) {
      return jsonError(
        `Zbyt wiele rejestracji z tej sieci. Spróbuj za ${limited.retryAfterSec} s.`,
        429,
      );
    }

    const body = registerSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const existing = await getUserByEmail(email);
    if (existing) return jsonError("Konto z tym e-mailem już istnieje.", 409);

    const passwordHash = await hashPassword(body.password);
    const result = await db.insert(users).values({
      email,
      password: passwordHash,
      isNewsletterMember: body.newsletter ?? false,
    });

    const userId = Number(result[0].insertId);

    const [customerRole] = await db
      .select()
      .from(accountTypes)
      .where(eq(accountTypes.name, ROLE.Customer))
      .limit(1);

    if (customerRole) {
      await db.insert(userAccountTypes).values({
        userId,
        accountTypeId: customerRole.id,
      });
    }

    await db.insert(auditLogs).values({
      userId,
      action: "CREATE",
      entityType: "users",
      entityId: userId,
      newValue: { email, roles: [ROLE.Customer] },
    });

    const roles = await loadUserRoles(userId);
    await createSession({ id: userId, email, roles });

    return jsonOk(
      {
        user: {
          id: userId,
          email,
          roles,
          isNewsletterMember: body.newsletter ?? false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna. Uruchom MySQL (docker compose up -d).", 503);
    }
    console.error(error);
    return jsonError("Nie udało się utworzyć konta.", 500);
  }
}
