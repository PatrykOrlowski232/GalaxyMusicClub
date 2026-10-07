import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  subscribed: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) return jsonError("Wymagane logowanie.", 401);

    const body = schema.parse(await request.json());

    const [before] = await db
      .select({ isNewsletterMember: users.isNewsletterMember })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    await db
      .update(users)
      .set({ isNewsletterMember: body.subscribed })
      .where(eq(users.id, session.id));

    await db.insert(auditLogs).values({
      userId: session.id,
      action: "UPDATE",
      entityType: "users",
      entityId: session.id,
      oldValue: { is_newsletter_member: before?.isNewsletterMember ?? false },
      newValue: { is_newsletter_member: body.subscribed },
    });

    return jsonOk({
      isNewsletterMember: body.subscribed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    console.error(error);
    return jsonError("Nie udało się zaktualizować newslettera.", 500);
  }
}
