import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accountTypes,
  auditLogs,
  promotorWallets,
  userAccountTypes,
} from "@/db/schema";
import { createSession, getSessionUser, loadUserRoles, ROLE } from "@/lib/auth";
import {
  allocateUniquePromoterCode,
  ensurePromoterWalletCode,
  getPromotorDashboard,
} from "@/server/queries";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Wymagane logowanie.", 401);

    const roles = await loadUserRoles(user.id);
    if (!roles.includes(ROLE.Promotor)) {
      return jsonError("Konto nie ma roli Promotor.", 403);
    }

    // odśwież cookie, jeśli JWT nie ma jeszcze roli
    if (!user.roles.includes(ROLE.Promotor)) {
      await createSession({ id: user.id, email: user.email, roles });
    }

    const [wallet] = await db
      .select()
      .from(promotorWallets)
      .where(eq(promotorWallets.userId, user.id))
      .limit(1);

    if (wallet) {
      await ensurePromoterWalletCode(wallet);
    }

    const dashboard = await getPromotorDashboard(user.id);
    if (!dashboard) {
      return jsonError("Brak portfela promotora. Aktywuj program ponownie.", 404);
    }
    return jsonOk({ dashboard, roles });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać panelu promotora.", 500);
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Wymagane logowanie.", 401);

    const [promotorRole] = await db
      .select()
      .from(accountTypes)
      .where(eq(accountTypes.name, ROLE.Promotor))
      .limit(1);

    if (!promotorRole) return jsonError("Brak roli Promotor w bazie.", 500);

    const [existingRole] = await db
      .select()
      .from(userAccountTypes)
      .where(
        and(
          eq(userAccountTypes.userId, user.id),
          eq(userAccountTypes.accountTypeId, promotorRole.id),
        ),
      )
      .limit(1);

    if (!existingRole) {
      await db.insert(userAccountTypes).values({
        userId: user.id,
        accountTypeId: promotorRole.id,
      });
    }

    const [existingWallet] = await db
      .select()
      .from(promotorWallets)
      .where(eq(promotorWallets.userId, user.id))
      .limit(1);

    if (!existingWallet) {
      const code = await allocateUniquePromoterCode();
      await db.insert(promotorWallets).values({
        userId: user.id,
        accountNumber: code,
      });
    } else {
      await ensurePromoterWalletCode(existingWallet);
    }

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "UPDATE",
      entityType: "users",
      entityId: user.id,
      newValue: { role: ROLE.Promotor },
    });

    const roles = await loadUserRoles(user.id);
    await createSession({ id: user.id, email: user.email, roles });

    const dashboard = await getPromotorDashboard(user.id);
    return jsonOk({ dashboard, roles });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się aktywować programu promotorskiego.", 500);
  }
}
