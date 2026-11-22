import { execa } from "execa";
import { extractVersion, failureResult } from "./baseChecker.js";
import type { CheckResult, Checker } from "./index.js";

const notInstalled: CheckResult = {
  installed: false,
  version: null,
  reason: "not-installed",
};

function isProfileEntry(token: string, pkg: string): boolean {
  return token === pkg || token.endsWith(`.${pkg}`) || token.endsWith(`#${pkg}`);
}

function hasWholeToken(stdout: string, pkg: string): boolean {
  return stdout
    .split("\n")
    .some((line: string): boolean =>
      line.split(/\s+/).some((token: string): boolean => isProfileEntry(token, pkg)),
    );
}

export const nixChecker: Checker = {
  name: "nix",

  async isAvailable(): Promise<boolean> {
    try {
      await execa("nix", ["--version"]);
      return true;
    } catch {
      return false;
    }
  },

  async check(pkg: string): Promise<CheckResult> {
    try {
      const { stdout } = await execa("nix-env", ["-q", "--exact", pkg]);
      return { installed: true, version: extractVersion(stdout), reason: "installed" };
    } catch {
      try {
        const { stdout } = await execa("nix", ["profile", "list"]);
        if (!hasWholeToken(stdout, pkg)) {
          return notInstalled;
        }
        return { installed: true, version: extractVersion(stdout), reason: "installed" };
      } catch (error: unknown) {
        return failureResult(error);
      }
    }
  },
};
