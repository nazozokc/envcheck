import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_FILE = "envcheck.config.json";

export interface EnvcheckConfig {
  defaultManager?: string;
  aliases: Record<string, string>;
  autoManagers?: string[];
}

export const defaultConfig: EnvcheckConfig = { aliases: {} };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotFound(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export function validateConfig(value: unknown): EnvcheckConfig {
  if (!isRecord(value)) {
    throw new Error("envcheck.config.json must contain an object");
  }

  const aliases: Record<string, string> = {};
  if (value.aliases !== undefined) {
    if (!isRecord(value.aliases)) {
      throw new Error("aliases must be an object");
    }
    for (const [key, target] of Object.entries(value.aliases)) {
      if (typeof target !== "string") {
        throw new Error(`alias ${key} must be a string`);
      }
      aliases[key] = target;
    }
  }

  const defaultManager: unknown = value.defaultManager;
  if (defaultManager !== undefined && typeof defaultManager !== "string") {
    throw new Error("defaultManager must be a string");
  }

  const autoManagers: unknown = value.autoManagers;
  if (autoManagers !== undefined) {
    if (
      !Array.isArray(autoManagers) ||
      !autoManagers.every((name: unknown): boolean => typeof name === "string")
    ) {
      throw new Error("autoManagers must be an array of strings");
    }
  }

  return {
    ...(defaultManager === undefined ? {} : { defaultManager }),
    aliases,
    ...(autoManagers === undefined
      ? {}
      : { autoManagers: autoManagers as string[] }),
  };
}

export async function loadConfig(cwd: string): Promise<EnvcheckConfig> {
  let raw: string;
  try {
    raw = await readFile(join(cwd, CONFIG_FILE), "utf8");
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return defaultConfig;
    }
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  return validateConfig(parsed);
}
