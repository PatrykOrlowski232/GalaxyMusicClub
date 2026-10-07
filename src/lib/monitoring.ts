type Extra = Record<string, unknown>;

/**
 * Monitoring błędów: zawsze log + opcjonalnie Sentry (@sentry/node),
 * gdy ustawione SENTRY_DSN.
 */
export async function captureException(
  error: unknown,
  extra?: Extra,
): Promise<void> {
  console.error("[galaxy]", error, extra ?? "");

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import("@sentry/node");
    if (!globalThis.__galaxySentryInit) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV ?? "development",
        tracesSampleRate: 0.1,
      });
      globalThis.__galaxySentryInit = true;
    }
    Sentry.captureException(error, { extra });
  } catch (err) {
    console.error("[galaxy] Sentry unavailable:", err);
  }
}

export async function captureMessage(
  message: string,
  extra?: Extra,
): Promise<void> {
  console.warn("[galaxy]", message, extra ?? "");
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/node");
    if (!globalThis.__galaxySentryInit) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV ?? "development",
      });
      globalThis.__galaxySentryInit = true;
    }
    Sentry.captureMessage(message, { extra, level: "warning" });
  } catch {
    /* ignore */
  }
}

declare global {
  var __galaxySentryInit: boolean | undefined;
}
