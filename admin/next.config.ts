import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import type { NextConfig } from "next";

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(adminDir, "..");

loadDotenv({ path: path.join(rootDir, ".env") });

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root: rootDir,
    resolveAlias: {
      "@": path.join(rootDir, "src"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(rootDir, "src"),
    };
    return config;
  },
};

export default nextConfig;
