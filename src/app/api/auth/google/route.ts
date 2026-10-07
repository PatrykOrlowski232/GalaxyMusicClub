import { NextResponse } from "next/server";
import {
  createGoogleOAuthState,
  buildGoogleAuthUrl,
  isGoogleAuthConfigured,
} from "@/lib/google-oauth";
import { getAppUrl } from "@/lib/stripe";

export async function GET() {
  try {
    if (!isGoogleAuthConfigured()) {
      const url = new URL("/konto", getAppUrl());
      url.searchParams.set(
        "google_error",
        "Logowanie Google nie jest skonfigurowane. Dodaj GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET w .env.",
      );
      return NextResponse.redirect(url);
    }

    const state = await createGoogleOAuthState();
    return NextResponse.redirect(buildGoogleAuthUrl(state));
  } catch (error) {
    console.error(error);
    const url = new URL("/konto", getAppUrl());
    url.searchParams.set(
      "google_error",
      error instanceof Error ? error.message : "Nie udało się uruchomić Google OAuth.",
    );
    return NextResponse.redirect(url);
  }
}
