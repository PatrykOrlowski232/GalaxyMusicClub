import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/stripe";

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.SMTP_FROM || process.env.SMTP_USER),
  );
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error(
      "Brak konfiguracji SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS). Ustaw je w .env.",
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: (() => {
      if (process.env.SMTP_TLS_INSECURE !== "1") return undefined;
      if (process.env.NODE_ENV === "production") {
        throw new Error("SMTP_TLS_INSECURE=1 jest niedozwolone w produkcji.");
      }
      return { rejectUnauthorized: false };
    })(),
  });
}

export async function sendNewsletterEmails(input: {
  subject: string;
  html: string;
  text: string;
  recipients: string[];
}) {
  if (input.recipients.length === 0) {
    return { sent: 0, dryRun: false };
  }

  // Bez SMTP: w trybie deweloperskim tylko log (żeby Admin mógł testować flow)
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Brak konfiguracji SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS).",
      );
    }
    console.info(
      `[newsletter dry-run] subject="${input.subject}" recipients=${input.recipients.length}`,
      input.recipients,
    );
    return { sent: input.recipients.length, dryRun: true };
  }

  const transporter = getTransporter();
  const from =
    process.env.SMTP_FROM ||
    `Galaxy Music Club <${process.env.SMTP_USER}>`;

  // wysyłka partiami (BCC) — unikamy tysięcy osobnych połączeń
  const chunkSize = 40;
  let sent = 0;
  for (let i = 0; i < input.recipients.length; i += chunkSize) {
    const chunk = input.recipients.slice(i, i + chunkSize);
    await transporter.sendMail({
      from,
      bcc: chunk,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    sent += chunk.length;
  }

  return { sent, dryRun: false };
}

export function buildNewsEmail(input: {
  title: string;
  body: string;
  categoryLabel: string;
}) {
  const appUrl = getAppUrl();
  const text = [
    `Galaxy Music Club — ${input.categoryLabel}`,
    "",
    input.title,
    "",
    input.body,
    "",
    `Zobacz aktualności: ${appUrl}/aktualnosci`,
    `Wypisz się z newslettera w koncie: ${appUrl}/konto`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <p style="letter-spacing:0.2em;text-transform:uppercase;color:#e91e8c;font-size:12px">Galaxy · ${input.categoryLabel}</p>
      <h1 style="font-size:22px;line-height:1.3">${escapeHtml(input.title)}</h1>
      <p style="white-space:pre-wrap;line-height:1.6;color:#333">${escapeHtml(input.body)}</p>
      <p style="margin-top:28px">
        <a href="${appUrl}/aktualnosci" style="color:#e91e8c">Zobacz aktualności na stronie</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#777">
        Jesteś na liście newslettera Galaxy Music Club.
        <a href="${appUrl}/konto" style="color:#777">Zarządzaj zgodą w koncie</a>.
      </p>
    </div>
  `;

  return { text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
