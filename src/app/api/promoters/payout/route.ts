import { z } from "zod";
import { getSessionUser, loadUserRoles, ROLE } from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { requestPromoterPayout } from "@/server/queries";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  bankAccount: z.string().min(8).max(42),
  bankAccountHolder: z.string().max(150).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Wymagane logowanie.", 401);

    const roles = await loadUserRoles(user.id);
    if (!roles.includes(ROLE.Promotor)) {
      return jsonError("Konto nie ma roli Promotor.", 403);
    }

    const body = schema.parse(await request.json());
    const result = await requestPromoterPayout({
      userId: user.id,
      amount: body.amount,
      bankAccount: body.bankAccount,
      bankAccountHolder: body.bankAccountHolder,
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "CREATE",
      entityType: "promotor_payout_requests",
      entityId: result.payoutId,
      newValue: {
        amount: result.amount,
        bankAccount: result.bankAccount,
      },
    });

    return jsonOk({
      ...result,
      message:
        "Wniosek o wypłatę przyjęty. Środki trafią na konto w ciągu 3 dni roboczych.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    const msg = error instanceof Error ? error.message : "Wypłata nie powiodła się.";
    console.error(error);
    return jsonError(msg, 400);
  }
}
