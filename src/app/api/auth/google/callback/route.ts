import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountTypes, auditLogs, userAccountTypes, users } from "@/db/schema";
import {
  createSession,
  getUserByEmail,
  loadUserRoles,
  ROLE,
} from "@/lib/auth";
import {
  exchangeGoogleCode,
  getGoogleRedirectUri,
  verifyGoogleOAuthState,
} from "@/lib/google-oauth";
import { getAppUrl } from "@/lib/stripe";
import { isDbUnavailable } from "@/lib/api";

function redirectWithError(message: string) {
  const url = new URL("/konto", getAppUrl());
  url.searchParams.set("google_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");

    if (oauthError) {
      return redirectWithError("Logowanie Google zostało anulowane.");
    }
    if (!code || !state) {
      return redirectWithError("Brak kodu autoryzacji Google.");
    }
    if (!(await verifyGoogleOAuthState(state))) {
      return redirectWithError("Nieprawidłowy stan OAuth. Spróbuj ponownie.");
    }

    const profile = await exchangeGoogleCode(code);
    if (profile.email_verified === false) {
      return redirectWithError("E-mail Google nie jest zweryfikowany.");
    }

    let user =
      (await db
        .select()
        .from(users)
        .where(eq(users.googleId, profile.sub))
        .limit(1)
        .then((rows) => rows[0] ?? null)) ||
      (await getUserByEmail(profile.email));

    if (user) {
      if (!user.googleId) {
        // Rejestracja hasłem nie weryfikuje e-maila — hasło mogła ustawić osoba trzecia,
        // więc po potwierdzeniu własności adresu przez Google przestaje być ważne.
        await db
          .update(users)
          .set({ googleId: profile.sub, password: null })
          .where(eq(users.id, user.id));
        await db.insert(auditLogs).values({
          userId: user.id,
          action: "UPDATE",
          entityType: "users",
          entityId: user.id,
          newValue: { provider: "google", linked: true, passwordCleared: !!user.password },
        });
      }
    } else {
      const [customer] = await db
        .select()
        .from(accountTypes)
        .where(eq(accountTypes.name, ROLE.Customer))
        .limit(1);
      if (!customer) {
        return redirectWithError("Brak roli Customer w bazie.");
      }

      const result = await db.insert(users).values({
        email: profile.email,
        googleId: profile.sub,
        password: null,
        isNewsletterMember: false,
      });
      const userId = Number(result[0].insertId);

      await db.insert(userAccountTypes).values({
        userId,
        accountTypeId: customer.id,
      });

      await db.insert(auditLogs).values({
        userId,
        action: "CREATE",
        entityType: "users",
        entityId: userId,
        newValue: { email: profile.email, provider: "google" },
      });

      user = await getUserByEmail(profile.email);
    }

    if (!user) {
      return redirectWithError("Nie udało się utworzyć konta Google.");
    }

    const roles = await loadUserRoles(user.id);
    await createSession({ id: user.id, email: user.email, roles });

    return NextResponse.redirect(new URL("/konto", getAppUrl()));
  } catch (error) {
    console.error("Google OAuth callback:", error, {
      redirectUri: getGoogleRedirectUri(),
    });
    if (isDbUnavailable(error)) {
      return redirectWithError("Baza danych niedostępna.");
    }
    const msg =
      error instanceof Error ? error.message : "Logowanie Google nie powiodło się.";
    return redirectWithError(msg);
  }
}
