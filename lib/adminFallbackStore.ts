import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FALLBACK_DIR = join(tmpdir(), "ecliptic-store");

declare global {
  // eslint-disable-next-line no-var
  var __eclipticAdminFallback: Record<string, unknown> | undefined;
}

function memoryStore() {
  if (!globalThis.__eclipticAdminFallback) {
    globalThis.__eclipticAdminFallback = {};
  }

  return globalThis.__eclipticAdminFallback;
}

function filePath(name: string) {
  return join(FALLBACK_DIR, `${name}.json`);
}

export async function readAdminFallback<T>(name: string): Promise<T | null> {
  const memory = memoryStore();
  if (memory[name]) return memory[name] as T;

  try {
    const raw = await readFile(filePath(name), "utf8");
    const parsed = JSON.parse(raw) as T;
    memory[name] = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeAdminFallback(name: string, value: unknown) {
  const memory = memoryStore();
  memory[name] = value;

  try {
    await mkdir(FALLBACK_DIR, { recursive: true });
    await writeFile(filePath(name), JSON.stringify(value), "utf8");
  } catch {
    // Serverless disk is best-effort; memory still keeps the current instance responsive.
  }
}
