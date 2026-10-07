import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal .env loader (zero dependencies). The compiled Nitro server does not
 * read .env files on its own, so server modules use env() to pick up secrets
 * (ADMIN_TOKEN, DATA_DIR) from a .env file in the working directory (project
 * root in dev, app root in production). Real environment variables always win
 * over the file. Loaded at most once per process.
 */

let fileEnv: Record<string, string> | null = null;

function parseDotEnv(raw: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const statement = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = statement.indexOf("=");
    if (eq <= 0) continue;
    const key = statement.slice(0, eq).trim();
    let value = statement.slice(eq + 1).trim();
    const quoted =
      value.length > 1 &&
      ((value[0] === '"' && value.at(-1) === '"') || (value[0] === "'" && value.at(-1) === "'"));
    if (!quoted) {
      const hash = value.indexOf(" #"); // strip trailing inline comment
      if (hash !== -1) value = value.slice(0, hash).trim();
    } else {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function loadFileEnv(): Record<string, string> {
  if (fileEnv) return fileEnv;
  fileEnv = {};
  const envPath = join(process.cwd(), ".env");
  try {
    if (existsSync(envPath)) fileEnv = parseDotEnv(readFileSync(envPath, "utf8"));
  } catch {
    /* unreadable .env — real environment only */
  }
  return fileEnv;
}

/** Reads an environment variable, falling back to the .env file (which never overrides the real environment). */
export function env(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess !== undefined) return fromProcess;
  return loadFileEnv()[name];
}
