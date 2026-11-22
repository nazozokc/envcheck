import { Command, CommanderError } from "commander";
import type { CheckReason, CheckResult, Checker } from "./checkers/index.js";
import { defaultConfig } from "./config.js";
import type { EnvcheckConfig } from "./config.js";

export interface CliOptions {
  json: boolean;
  quiet: boolean;
  noColor: boolean;
}

export interface CheckLine {
  manager: string;
  package: string;
  installed: boolean;
  version: string | null;
  reason: CheckReason;
}

export interface ManagerLine {
  name: string;
  available: boolean;
}

type RawOutcome =
  | { kind: "results"; lines: CheckLine[] }
  | { kind: "error"; message: string; hint?: string }
  | { kind: "help" }
  | { kind: "list"; managers: ManagerLine[] };

export type Outcome = RawOutcome & { options: CliOptions };

export interface Output {
  writeOut(message: string): void;
  writeErr(message: string): void;
}

export interface Reporter {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
  raw(message: string): void;
}

export interface BuildOptions {
  output?: Output;
  config?: EnvcheckConfig;
}

interface CommanderOptions {
  json?: boolean;
  quiet?: boolean;
  color?: boolean;
}

function currentOptions(program: Command): CliOptions {
  const opts: CommanderOptions = program.opts<CommanderOptions>();
  return {
    json: opts.json === true,
    quiet: opts.quiet === true,
    noColor: opts.color === false,
  };
}

function resolveArguments(
  manager: string | undefined,
  packages: string[],
  checkers: Record<string, Checker>,
  config: EnvcheckConfig,
): { manager: string | undefined; packages: string[] } {
  if (
    manager !== undefined &&
    packages.length === 0 &&
    config.defaultManager !== undefined &&
    checkers[manager] === undefined &&
    manager !== "list" &&
    manager !== "auto"
  ) {
    return { manager: config.defaultManager, packages: [manager] };
  }
  return { manager: manager ?? config.defaultManager, packages };
}

async function listManagers(
  checkers: Record<string, Checker>,
): Promise<RawOutcome> {
  const managers: ManagerLine[] = [];
  for (const [name, checker] of Object.entries(checkers)) {
    managers.push({ name, available: await checker.isAvailable() });
  }
  return { kind: "list", managers };
}

async function autoCheck(
  packages: string[],
  checkers: Record<string, Checker>,
  config: EnvcheckConfig,
): Promise<RawOutcome> {
  const names: string[] = config.autoManagers ?? Object.keys(checkers);
  const available: Array<{ name: string; checker: Checker }> = [];
  for (const name of names) {
    const checker: Checker | undefined = checkers[name];
    if (checker !== undefined && (await checker.isAvailable())) {
      available.push({ name, checker });
    }
  }

  if (available.length === 0) {
    return { kind: "error", message: "No package manager is available on this system" };
  }

  const lines: CheckLine[] = [];
  for (const pkg of packages) {
    const target: string = config.aliases[pkg] ?? pkg;
    let found: { name: string; result: CheckResult } | undefined;
    for (const entry of available) {
      const result: CheckResult = await entry.checker.check(target);
      if (result.installed) {
        found = { name: entry.name, result };
        break;
      }
    }
    lines.push({
      manager: found?.name ?? "auto",
      package: pkg,
      installed: found !== undefined,
      version: found?.result.version ?? null,
      reason: found !== undefined ? "installed" : "not-installed",
    });
  }
  return { kind: "results", lines };
}

async function checkPackages(
  manager: string,
  packages: string[],
  checkers: Record<string, Checker>,
  config: EnvcheckConfig,
): Promise<RawOutcome> {
  if (manager === "list") {
    return listManagers(checkers);
  }
  if (manager === "auto") {
    return autoCheck(packages, checkers, config);
  }

  const checker: Checker | undefined = checkers[manager];
  if (checker === undefined) {
    return {
      kind: "error",
      message: `Unsupported package manager: ${manager}`,
      hint: `Supported managers: ${Object.keys(checkers).join(", ")}`,
    };
  }

  if (!(await checker.isAvailable())) {
    return { kind: "error", message: `${manager} is not available on this system` };
  }

  const lines: CheckLine[] = [];
  for (const pkg of packages) {
    const target: string = config.aliases[pkg] ?? pkg;
    const result: CheckResult = await checker.check(target);
    lines.push({
      manager,
      package: pkg,
      installed: result.installed,
      version: result.version,
      reason: result.reason,
    });
  }
  return { kind: "results", lines };
}

export async function buildOutcome(
  argv: string[],
  checkers: Record<string, Checker>,
  options: BuildOptions = {},
): Promise<Outcome> {
  const config: EnvcheckConfig = options.config ?? defaultConfig;
  const output: Output = options.output ?? {
    writeOut: (message: string): void => {
      process.stdout.write(message);
    },
    writeErr: (message: string): void => {
      process.stderr.write(message);
    },
  };

  let rawOutcome: RawOutcome | undefined;

  const program = new Command();
  program
    .name("envcheck")
    .description(
      "CLI tool to check if packages are installed via various package managers",
    )
    .argument("[manager]", "package manager to use, 'list', or 'auto'")
    .argument("[packages...]", "packages to check")
    .option("--json", "output results as JSON")
    .option("--quiet", "only print failed checks")
    .option("--no-color", "disable colored output")
    .exitOverride()
    .configureOutput(output)
    .action(
      async (
        manager: string | undefined,
        packages: string[],
      ): Promise<void> => {
        const resolved = resolveArguments(manager, packages, checkers, config);
        if (resolved.manager === undefined) {
          rawOutcome = {
            kind: "error",
            message: "Missing package manager",
            hint: "Pass a manager or set defaultManager in envcheck.config.json",
          };
          return;
        }
        rawOutcome = await checkPackages(
          resolved.manager,
          resolved.packages,
          checkers,
          config,
        );
      },
    );

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error: unknown) {
    if (error instanceof CommanderError) {
      if (
        error.code === "commander.helpDisplayed" ||
        error.code === "commander.version"
      ) {
        return { kind: "help", options: currentOptions(program) };
      }
      return {
        kind: "error",
        message: error.message,
        options: currentOptions(program),
      };
    }
    throw error;
  }

  if (rawOutcome === undefined) {
    throw new Error("CLI action did not produce an outcome");
  }
  return { ...rawOutcome, options: currentOptions(program) };
}

function exitCode(outcome: Outcome): number {
  switch (outcome.kind) {
    case "help":
    case "list":
      return 0;
    case "error":
      return 2;
    case "results":
      return outcome.lines.every((line: CheckLine): boolean => line.installed) ? 0 : 1;
  }
}

function toJsonObject(outcome: Outcome): Record<string, unknown> {
  switch (outcome.kind) {
    case "help":
      return { help: true };
    case "list":
      return { managers: outcome.managers };
    case "error":
      return {
        error: outcome.message,
        ...(outcome.hint === undefined ? {} : { hint: outcome.hint }),
      };
    case "results": {
      const ok: boolean = outcome.lines.every(
        (line: CheckLine): boolean => line.installed,
      );
      return { results: outcome.lines, ok };
    }
  }
}

export function printOutcome(outcome: Outcome, reporter: Reporter): number {
  if (outcome.options.json) {
    reporter.raw(JSON.stringify(toJsonObject(outcome)));
    return exitCode(outcome);
  }

  switch (outcome.kind) {
    case "help":
      return 0;

    case "list": {
      const width: number = outcome.managers.reduce(
        (max: number, manager: ManagerLine): number => Math.max(max, manager.name.length),
        0,
      );
      for (const manager of outcome.managers) {
        const message = `${manager.name.padEnd(width)} ... ${manager.available ? "available" : "not available"}`;
        if (manager.available) {
          reporter.success(message);
        } else {
          reporter.info(message);
        }
      }
      return 0;
    }

    case "error":
      reporter.error(outcome.message);
      if (outcome.hint !== undefined) {
        reporter.info(outcome.hint);
      }
      return 2;

    case "results": {
      const width = outcome.lines.reduce(
        (max: number, line: CheckLine): number => Math.max(max, line.package.length),
        0,
      );
      for (const line of outcome.lines) {
        if (line.installed && outcome.options.quiet) {
          continue;
        }
        const message = `[${line.manager}] ${line.package.padEnd(width)} ... ${line.installed ? "OK" : "NG"}`;
        if (line.installed) {
          reporter.success(message);
        } else {
          reporter.error(message);
        }
      }
      return exitCode(outcome);
    }
  }
}
