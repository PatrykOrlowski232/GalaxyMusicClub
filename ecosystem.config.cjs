const fs = require("node:fs");
const path = require("node:path");

/** Ładuje `.env` z cwd aplikacji do process.env (nie nadpisuje już ustawionych). */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const appDir = path.resolve(__dirname);
loadEnvFile(path.join(appDir, ".env"));

const sharedEnv = Object.fromEntries(
  [
    "DATABASE_URL",
    "AUTH_SECRET",
    "APP_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "PROMOTER_COMMISSION_RATE",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
    "SENTRY_DSN",
  ]
    .filter((k) => process.env[k] != null && process.env[k] !== "")
    .map((k) => [k, process.env[k]]),
);

module.exports = {
  apps: [
    {
      name: "galaxy",
      cwd: appDir,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        ...sharedEnv,
      },
      max_memory_restart: "512M",
      time: true,
    },
    {
      name: "galaxy-admin",
      cwd: path.join(appDir, "admin"),
      script: path.join(appDir, "node_modules/next/dist/bin/next"),
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        ...sharedEnv,
      },
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
