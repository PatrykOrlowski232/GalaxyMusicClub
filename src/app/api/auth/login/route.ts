import { z } from "zod";
import {
  createSession,
  getUserByEmail,
  loadUserRoles,
  verifyPassword,
} from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`login:${ip}`, { limit: 20, windowMs: 15 * 60_000 });
    if (!limited.ok) {
      return jsonError(
        `Zbyt wiele prób logowania. Spróbuj za ${limited.retryAfterSec} s.`,
        429,
      );
    }

    const body = loginSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const perEmail = rateLimit(`login-email:${email}`, {
      limit: 10,
      windowMs: 15 * 60_000,
    });
    if (!perEmail.ok) {
      return jsonError(
        `Zbyt wiele prób dla tego konta. Spróbuj za ${perEmail.retryAfterSec} s.`,
        429,
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
    }
    if (!user.password) {
      return jsonError(
        "To konto używa logowania Google. Kliknij „Kontynuuj z Google”.",
        401,
      );
    }
    if (!(await verifyPassword(body.password, user.password))) {
      return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
    }

    const roles = await loadUserRoles(user.id);
    await createSession({ id: user.id, email: user.email, roles });

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        roles,
        isNewsletterMember: user.isNewsletterMember,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna. Uruchom MySQL (docker compose up -d).", 503);
    }
    console.error(error);
    return jsonError("Logowanie nie powiodło się.", 500);
  }
}
