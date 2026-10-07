import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, loadUserRoles } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonOk({ user: null });

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      isNewsletterMember: users.isNewsletterMember,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!row) return jsonOk({ user: null });

  const roles = await loadUserRoles(row.id);
  return jsonOk({
    user: {
      id: row.id,
      email: row.email,
      roles,
      isNewsletterMember: row.isNewsletterMember,
    },
  });
}
