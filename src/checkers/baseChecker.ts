import { execa } from "execa";
import type { CheckReason, Checker, CheckResult } from "./index.js";

type CommandParts = [string, ...string[]];

const notInstalled: CheckResult = {
  installed: false,
  version: null,
  reason: "not-installed",
};

function failureReason(error: unknown): CheckReason {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT"
  ) {
    return "unavailable";
  }
  return "command-failed";
}

export function failureResult(error: unknown): CheckResult {
  return { installed: false, version: null, reason: failureReason(error) };
}

export function extractVersion(text: string): string | null {
  const match: RegExpMatchArray | null = text.match(/v?\d+\.\d+(?:\.\d+)?/);
  return match?.[0] ?? null;
}

function isAvailableViaVersion(binary: string): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      await execa(binary, ["--version"]);
      return true;
    } catch {
      // A missing binary or a failed version command both mean unavailable.
      return false;
    }
  };
}

/** Check a package by relying on the command's exit code alone. */
export const createSimpleChecker = (
  name: string,
  [binary, ...args]: CommandParts,
): Checker => ({
  name,
  isAvailable: isAvailableViaVersion(binary),
  async check(pkg: string): Promise<CheckResult> {
    try {
      const { stdout } = await execa(binary, [...args, pkg]);
      return { installed: true, version: extractVersion(stdout), reason: "installed" };
    } catch (error: unknown) {
      return failureResult(error);
    }
  },
});

/** Check a package by inspecting the command's stdout for a marker. */
export const createOutputChecker = (
  name: string,
  [binary, ...args]: CommandParts,
  isMatch: (stdout: string, pkg: string) => boolean,
): Checker => ({
  name,
  isAvailable: isAvailableViaVersion(binary),
  async check(pkg: string): Promise<CheckResult> {
    try {
      const { stdout } = await execa(binary, [...args, pkg]);
      if (!isMatch(stdout, pkg)) {
        return notInstalled;
      }
      return { installed: true, version: extractVersion(stdout), reason: "installed" };
    } catch (error: unknown) {
      return failureResult(error);
    }
  },
});

/** Extract the first whitespace-delimited column from a list output line. */
export const firstColumn = (line: string): string => line.trim().split(/\s+/)[0] ?? "";

/** Check a package against a command that lists installed packages. */
export const createListChecker = (
  name: string,
  [binary, ...args]: CommandParts,
  parseLine: (line: string) => string = (line: string): string => line.trim(),
): Checker => ({
  name,
  isAvailable: isAvailableViaVersion(binary),
  async check(pkg: string): Promise<CheckResult> {
    try {
      const { stdout } = await execa(binary, args);
      const matched: string | undefined = stdout
        .split("\n")
        .find((line: string): boolean => parseLine(line) === pkg);
      if (matched === undefined) {
        return notInstalled;
      }
      return { installed: true, version: extractVersion(matched), reason: "installed" };
    } catch (error: unknown) {
      return failureResult(error);
    }
  },
});
