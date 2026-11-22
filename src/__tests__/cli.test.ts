import { describe, expect, it, vi } from "vitest";
import { buildOutcome, printOutcome } from "../cli.js";
import type { Output, Reporter } from "../cli.js";
import type { Checker, CheckResult } from "../checkers/index.js";

const defaultOptions = { json: false, quiet: false, noColor: false };

function result(installed: boolean): CheckResult {
  return {
    installed,
    version: installed ? "1.2.3" : null,
    reason: installed ? "installed" : "not-installed",
  };
}

function createChecker(installed: boolean): Checker {
  return {
    name: "test",
    isAvailable: vi.fn(async (): Promise<boolean> => true),
    check: vi.fn(async (): Promise<CheckResult> => result(installed)),
  };
}

function createReporter(): Reporter {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    raw: vi.fn(),
  };
}

function createOutput(): Output {
  return {
    writeOut: vi.fn(),
    writeErr: vi.fn(),
  };
}

describe("buildOutcome", () => {
  it("returns results for all installed packages", async () => {
    const checker = createChecker(true);
    const outcome = await buildOutcome(["test", "git", "node"], {
      test: checker,
    });

    expect(outcome).toEqual({
      kind: "results",
      options: defaultOptions,
      lines: [
        { manager: "test", package: "git", installed: true, version: "1.2.3", reason: "installed" },
        { manager: "test", package: "node", installed: true, version: "1.2.3", reason: "installed" },
      ],
    });
    expect(checker.isAvailable).toHaveBeenCalledOnce();
    expect(checker.check).toHaveBeenCalledTimes(2);
  });

  it("keeps NG entries without aborting the remaining checks", async () => {
    const checker = createChecker(false);
    const outcome = await buildOutcome(["test", "git", "node"], { test: checker });

    expect(outcome).toEqual({
      kind: "results",
      options: defaultOptions,
      lines: [
        { manager: "test", package: "git", installed: false, version: null, reason: "not-installed" },
        { manager: "test", package: "node", installed: false, version: null, reason: "not-installed" },
      ],
    });
  });

  it("returns an error with supported managers for an unknown manager", async () => {
    const outcome = await buildOutcome(["bogus", "git"], { test: createChecker(true) });

    expect(outcome).toEqual({
      kind: "error",
      options: defaultOptions,
      message: "Unsupported package manager: bogus",
      hint: "Supported managers: test",
    });
  });

  it("returns an error when the manager is not available", async () => {
    const checker = createChecker(true);
    checker.isAvailable = vi.fn(async (): Promise<boolean> => false);

    const outcome = await buildOutcome(["test", "git"], { test: checker });

    expect(outcome).toEqual({
      kind: "error",
      options: defaultOptions,
      message: "test is not available on this system",
    });
    expect(checker.check).not.toHaveBeenCalled();
  });

  it("returns an error for missing arguments", async () => {
    const outcome = await buildOutcome([], {}, { output: createOutput() });

    expect(outcome).toMatchObject({
      kind: "error",
      message: "Missing package manager",
    });
  });

  it("returns help without checking anything", async () => {
    const checker = createChecker(true);
    const output = createOutput();
    const outcome = await buildOutcome(["--help"], { test: checker }, { output });

    expect(outcome).toEqual({ kind: "help", options: defaultOptions });
    expect(output.writeOut).toHaveBeenCalled();
    expect(checker.isAvailable).not.toHaveBeenCalled();
  });

  it("parses --json, --quiet and --no-color", async () => {
    const outcome = await buildOutcome(
      ["test", "git", "--json", "--quiet", "--no-color"],
      { test: createChecker(true) },
      { output: createOutput() },
    );

    expect(outcome.options).toEqual({ json: true, quiet: true, noColor: true });
  });
});

describe("printOutcome", () => {
  it("returns 0 and prints aligned success lines when everything is OK", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "results",
        options: defaultOptions,
        lines: [
          { manager: "test", package: "git", installed: true, version: "1.2.3", reason: "installed" },
          { manager: "test", package: "python", installed: true, version: "2.0.0", reason: "installed" },
        ],
      },
      reporter,
    );

    expect(code).toBe(0);
    expect(reporter.success).toHaveBeenCalledWith("[test] git    ... OK");
    expect(reporter.success).toHaveBeenCalledWith("[test] python ... OK");
    expect(reporter.error).not.toHaveBeenCalled();
  });

  it("returns 1 and prints a red line for a failed check", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "results",
        options: defaultOptions,
        lines: [{ manager: "test", package: "git", installed: false, version: null, reason: "not-installed" }],
      },
      reporter,
    );

    expect(code).toBe(1);
    expect(reporter.error).toHaveBeenCalledWith("[test] git ... NG");
  });

  it("returns 2 and prints the hint for an unsupported manager", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "error",
        options: defaultOptions,
        message: "Unsupported package manager: bogus",
        hint: "Supported managers: test",
      },
      reporter,
    );

    expect(code).toBe(2);
    expect(reporter.error).toHaveBeenCalledWith("Unsupported package manager: bogus");
    expect(reporter.info).toHaveBeenCalledWith("Supported managers: test");
  });

  it("returns 0 for help", () => {
    expect(printOutcome({ kind: "help", options: defaultOptions }, createReporter())).toBe(0);
  });

  it("prints a JSON document when --json is set", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "results",
        options: { ...defaultOptions, json: true },
        lines: [{ manager: "test", package: "git", installed: true, version: "1.2.3", reason: "installed" }],
      },
      reporter,
    );

    expect(code).toBe(0);
    expect(reporter.raw).toHaveBeenCalledWith(
      JSON.stringify({
        results: [
          { manager: "test", package: "git", installed: true, version: "1.2.3", reason: "installed" },
        ],
        ok: true,
      }),
    );
    expect(reporter.success).not.toHaveBeenCalled();
  });

  it("prints only failures when --quiet is set", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "results",
        options: { ...defaultOptions, quiet: true },
        lines: [
          { manager: "test", package: "git", installed: true, version: "1.2.3", reason: "installed" },
          { manager: "test", package: "node", installed: false, version: null, reason: "not-installed" },
        ],
      },
      reporter,
    );

    expect(code).toBe(1);
    expect(reporter.success).not.toHaveBeenCalled();
    expect(reporter.error).toHaveBeenCalledOnce();
    expect(reporter.error).toHaveBeenCalledWith("[test] node ... NG");
  });
});

describe("list mode", () => {
  it("reports the availability of every checker", async () => {
    const available = createChecker(true);
    const unavailable = createChecker(true);
    unavailable.isAvailable = vi.fn(async (): Promise<boolean> => false);

    const outcome = await buildOutcome(
      ["list"],
      { one: available, two: unavailable },
      { output: createOutput() },
    );

    expect(outcome).toEqual({
      kind: "list",
      options: defaultOptions,
      managers: [
        { name: "one", available: true },
        { name: "two", available: false },
      ],
    });
  });

  it("prints the manager list and returns 0", () => {
    const reporter = createReporter();
    const code = printOutcome(
      {
        kind: "list",
        options: defaultOptions,
        managers: [
          { name: "one", available: true },
          { name: "two", available: false },
        ],
      },
      reporter,
    );

    expect(code).toBe(0);
    expect(reporter.success).toHaveBeenCalledWith("one ... available");
    expect(reporter.info).toHaveBeenCalledWith("two ... not available");
  });
});

describe("auto mode", () => {
  it("uses the first available manager that reports the package installed", async () => {
    const first = createChecker(false);
    const second = createChecker(true);

    const outcome = await buildOutcome(
      ["auto", "node"],
      { first, second },
      { output: createOutput() },
    );

    expect(outcome).toMatchObject({
      kind: "results",
      lines: [
        {
          manager: "second",
          package: "node",
          installed: true,
          version: "1.2.3",
          reason: "installed",
        },
      ],
    });
    expect(first.check).toHaveBeenCalledWith("node");
    expect(second.check).toHaveBeenCalledWith("node");
  });

  it("returns an error when no manager is available", async () => {
    const checker = createChecker(true);
    checker.isAvailable = vi.fn(async (): Promise<boolean> => false);

    const outcome = await buildOutcome(
      ["auto", "node"],
      { test: checker },
      { output: createOutput() },
    );

    expect(outcome).toEqual({
      kind: "error",
      options: defaultOptions,
      message: "No package manager is available on this system",
    });
  });

  it("honours autoManagers from the config", async () => {
    const chosen = createChecker(true);
    const ignored = createChecker(true);

    const outcome = await buildOutcome(
      ["auto", "node"],
      { chosen, ignored },
      { config: { aliases: {}, autoManagers: ["chosen"] }, output: createOutput() },
    );

    expect(outcome).toMatchObject({ lines: [{ manager: "chosen" }] });
    expect(ignored.isAvailable).not.toHaveBeenCalled();
  });
});

describe("configuration", () => {
  it("resolves package aliases before checking", async () => {
    const checker = createChecker(true);
    const outcome = await buildOutcome(
      ["test", "node"],
      { test: checker },
      { config: { aliases: { node: "nodejs" } }, output: createOutput() },
    );

    expect(checker.check).toHaveBeenCalledWith("nodejs");
    expect(outcome).toMatchObject({ lines: [{ package: "node" }] });
  });

  it("uses defaultManager when the manager argument is omitted", async () => {
    const checker = createChecker(true);
    const outcome = await buildOutcome(
      ["node"],
      { test: checker },
      { config: { aliases: {}, defaultManager: "test" }, output: createOutput() },
    );

    expect(outcome).toMatchObject({ kind: "results", lines: [{ manager: "test" }] });
  });

  it("returns an error when no manager and no default are given", async () => {
    const outcome = await buildOutcome([], {}, { output: createOutput() });

    expect(outcome).toMatchObject({ kind: "error", message: "Missing package manager" });
  });
});
