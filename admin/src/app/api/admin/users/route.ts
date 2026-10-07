import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminListUsers,
  adminSetUserRoles,
  writeAudit,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ users: await adminListUsers() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd listy użytkowników.", 500);
  }
}

const rolesSchema = z.object({
  userId: z.number().int().positive(),
  roles: z.array(z.string()),
});

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = rolesSchema.parse(await request.json());
    await adminSetUserRoles(body.userId, body.roles);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "user_account_types",
      entityId: body.userId,
      newValue: body,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie udało się zapisać ról.", 500);
  }
}
