import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { accountTypes, userAccountTypes, users } from "../src/db/schema";
import { hashPassword, ROLE } from "../src/lib/auth";

const STAFF = [
  {
    email: "admin@galaxy.gdansk",
    password: "AdminGalaxy1!",
    role: ROLE.Admin,
  },
  {
    email: "owner@galaxy.gdansk",
    password: "OwnerGalaxy1!",
    role: ROLE.Owner,
  },
] as const;

async function ensureRole(name: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(accountTypes)
    .where(eq(accountTypes.name, name))
    .limit(1);
  if (!row) throw new Error(`Brak roli ${name} w account_types`);
  return row.id;
}

async function upsertStaffUser(email: string, password: string, roleName: string) {
  const db = getDb();
  const roleId = await ensureRole(roleName);
  const hash = await hashPassword(password);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;
  if (existing) {
    userId = existing.id;
    await db.update(users).set({ password: hash }).where(eq(users.id, userId));
    console.log(`Zaktualizowano hasło: ${email}`);
  } else {
    const result = await db.insert(users).values({
      email,
      password: hash,
      isNewsletterMember: false,
    });
    userId = Number(result[0].insertId);
    console.log(`Utworzono: ${email}`);
  }

  const [link] = await db
    .select()
    .from(userAccountTypes)
    .where(eq(userAccountTypes.userId, userId));

  const hasRole = await db
    .select()
    .from(userAccountTypes)
    .where(eq(userAccountTypes.userId, userId));

  if (!hasRole.some((r) => r.accountTypeId === roleId)) {
    await db.insert(userAccountTypes).values({
      userId,
      accountTypeId: roleId,
    });
  }

  // also give Customer for completeness? No - staff only Admin/Owner
  void link;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_STAFF !== "1") {
    console.error(
      "Seed staff zablokowany w produkcji. Ustaw ALLOW_SEED_STAFF=1 tylko świadomie,\n" +
        "potem NATYCHMIAST zmień hasła. Lepiej: utwórz konta ręcznie z silnymi hasłami.",
    );
    process.exit(1);
  }

  for (const account of STAFF) {
    await upsertStaffUser(account.email, account.password, account.role);
  }
  console.log("\nKonta staff gotowe (TYLKO DEV — zmień hasła przed produkcją):");
  for (const account of STAFF) {
    console.log(`  ${account.role}: ${account.email} / ${account.password}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
