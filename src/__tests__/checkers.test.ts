import { beforeEach, describe, expect, it, vi } from "vitest";
import { execa } from "execa";
import type { Checker } from "../checkers/index.js";
import { nixChecker } from "../checkers/nix.js";
import { aptChecker } from "../checkers/apt.js";
import { pacmanChecker } from "../checkers/pacman.js";
import { scoopChecker } from "../checkers/scoop.js";
import { brewChecker } from "../checkers/brew.js";
import { wingetChecker } from "../checkers/winget.js";
import { dnfChecker } from "../checkers/dnf.js";
import { zypperChecker } from "../checkers/zypper.js";
import { apkChecker } from "../checkers/apk.js";
import { cargoChecker } from "../checkers/cargo.js";
import { pipChecker } from "../checkers/pip.js";
import { npmChecker } from "../checkers/npm.js";
import { gemChecker } from "../checkers/gem.js";
import { flatpakChecker } from "../checkers/flatpak.js";
import { snapChecker } from "../checkers/snap.js";
import { chocoChecker } from "../checkers/choco.js";
import { composerChecker } from "../checkers/composer.js";
import { dotnetChecker } from "../checkers/dotnet.js";
import { condaChecker } from "../checkers/conda.js";

vi.mock("execa", async (importOriginal) => {
  const actual = await importOriginal<typeof import("execa")>();
  return { ...actual, execa: vi.fn() };
});

const mockExeca = vi.mocked(execa);

function resolveOnce(stdout = ""): void {
  mockExeca.mockResolvedValueOnce({
    stdout,
  } as unknown as Awaited<ReturnType<typeof execa>>);
}

function rejectOnce(): void {
  mockExeca.mockRejectedValueOnce(new Error("command failed"));
}

interface SimpleCase {
  name: string;
  checker: Checker;
  binary: string;
  args: string[];
  pkg: string;
}

const simpleCases: SimpleCase[] = [
  {
    name: "pacman",
    checker: pacmanChecker,
    binary: "pacman",
    args: ["-Q", "git"],
    pkg: "git",
  },
  {
    name: "dnf",
    checker: dnfChecker,
    binary: "dnf",
    args: ["-q", "list", "installed", "git"],
    pkg: "git",
  },
  {
    name: "apk",
    checker: apkChecker,
    binary: "apk",
    args: ["info", "-e", "git"],
    pkg: "git",
  },
  {
    name: "pip",
    checker: pipChecker,
    binary: "pip",
    args: ["show", "git"],
    pkg: "git",
  },
  {
    name: "npm",
    checker: npmChecker,
    binary: "npm",
    args: ["ls", "-g", "--depth=0", "typescript"],
    pkg: "typescript",
  },
  {
    name: "gem",
    checker: gemChecker,
    binary: "gem",
    args: ["list", "-i", "-e", "rake"],
    pkg: "rake",
  },
  {
    name: "composer",
    checker: composerChecker,
    binary: "composer",
    args: ["global", "show", "phpunit"],
    pkg: "phpunit",
  },
];

interface OutputCase {
  name: string;
  checker: Checker;
  binary: string;
  args: string[];
  pkg: string;
  installed: string;
  missing: string;
}

const outputCases: OutputCase[] = [
  {
    name: "apt",
    checker: aptChecker,
    binary: "dpkg-query",
    args: ["-W", "-f=${Status}", "git"],
    pkg: "git",
    installed: "install ok installed\n",
    missing: "deinstall ok config-files\n",
  },
  {
    name: "zypper",
    checker: zypperChecker,
    binary: "zypper",
    args: ["--quiet", "se", "--installed-only", "--exact", "git"],
    pkg: "git",
    installed:
      "S  | Name | Type    | Version | Arch\n i | git  | package | 2.39.0  | x86_64\n",
    missing: "S  | Name | Type | Version | Arch\n",
  },
  {
    name: "choco",
    checker: chocoChecker,
    binary: "choco",
    args: ["list", "--local-only", "--exact", "git"],
    pkg: "git",
    installed: "Packages found locally: 1\ngit\n",
    missing: "Packages found locally: 0\n",
  },
  {
    name: "conda",
    checker: condaChecker,
    binary: "conda",
    args: ["list", "numpy"],
    pkg: "numpy",
    installed: "# Name                    Version\nnumpy                    1.24.0\n",
    missing: "# Name                    Version\n",
  },
];

interface ListCase {
  name: string;
  checker: Checker;
  binary: string;
  listArgs: string[];
  output: string;
  installed: string;
  missing: string;
}

const listCases: ListCase[] = [
  {
    name: "brew",
    checker: brewChecker,
    binary: "brew",
    listArgs: ["list"],
    output: "git\nnode\n",
    installed: "git",
    missing: "python",
  },
  {
    name: "scoop",
    checker: scoopChecker,
    binary: "scoop",
    listArgs: ["list"],
    output: "git 2.40.0\nnode 18.17.0\n",
    installed: "node",
    missing: "python",
  },
  {
    name: "winget",
    checker: wingetChecker,
    binary: "winget",
    listArgs: ["list"],
    output: "Git.Git 2.40.0\nNodejs.NodeJS 18.17.0\n",
    installed: "Nodejs.NodeJS",
    missing: "Python.Python",
  },
  {
    name: "cargo",
    checker: cargoChecker,
    binary: "cargo",
    listArgs: ["install", "--list"],
    output: "git-delta v0.16.1:\n    /home/user/.cargo/bin/delta\n",
    installed: "git-delta",
    missing: "ripgrep",
  },
  {
    name: "flatpak",
    checker: flatpakChecker,
    binary: "flatpak",
    listArgs: ["list", "--app", "--columns=application"],
    output: "org.gimp.GIMP\norg.mozilla.firefox\n",
    installed: "org.gimp.GIMP",
    missing: "org.inkscape.Inkscape",
  },
  {
    name: "snap",
    checker: snapChecker,
    binary: "snap",
    listArgs: ["list"],
    output: "Name   Version   Rev\ncore   20-2      1\nnode   18.17.0   2\n",
    installed: "node",
    missing: "code",
  },
  {
    name: "dotnet",
    checker: dotnetChecker,
    binary: "dotnet",
    listArgs: ["tool", "list", "-g"],
    output: "Package Id      Version   Commands\n--------------  -------   --------\ndotnet-say      1.0.0     dotnet-say\n",
    installed: "dotnet-say",
    missing: "dotnet-foo",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe.each(simpleCases)("$name checker", ({ checker, binary, args, pkg }) => {
  it("checks availability with --version", async () => {
    resolveOnce();

    expect(await checker.isAvailable()).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, ["--version"]);
  });

  it("treats a failed version command as unavailable", async () => {
    rejectOnce();

    expect(await checker.isAvailable()).toBe(false);
  });

  it("checks the package with the exact command arguments", async () => {
    resolveOnce();

    expect((await checker.check(pkg)).installed).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, args);
  });

  it("treats a failed package command as not installed", async () => {
    rejectOnce();

    expect((await checker.check(pkg)).installed).toBe(false);
  });
});

describe.each(outputCases)("$name checker", ({ checker, binary, args, pkg, installed, missing }) => {
  it("checks availability with --version", async () => {
    resolveOnce();

    expect(await checker.isAvailable()).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, ["--version"]);
  });

  it("matches the installed marker in stdout", async () => {
    resolveOnce(installed);

    expect((await checker.check(pkg)).installed).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, args);
  });

  it("does not match when the marker is absent", async () => {
    resolveOnce(missing);

    expect((await checker.check(pkg)).installed).toBe(false);
  });

  it("treats a failed command as not installed", async () => {
    rejectOnce();

    expect((await checker.check(pkg)).installed).toBe(false);
  });
});

describe.each(listCases)("$name checker", ({ checker, binary, listArgs, output, installed, missing }) => {
  it("checks availability with --version", async () => {
    resolveOnce();

    expect(await checker.isAvailable()).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, ["--version"]);
  });

  it("finds a package in the list output", async () => {
    resolveOnce(output);

    expect((await checker.check(installed)).installed).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith(binary, listArgs);
  });

  it("does not report a package that is absent from the list", async () => {
    resolveOnce(output);

    expect((await checker.check(missing)).installed).toBe(false);
  });

  it("treats a failed list command as not installed", async () => {
    rejectOnce();

    expect((await checker.check(installed)).installed).toBe(false);
  });
});

describe("nix checker", () => {
  it("checks availability with --version", async () => {
    resolveOnce();

    expect(await nixChecker.isAvailable()).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith("nix", ["--version"]);
  });

  it("checks with nix-env --exact first", async () => {
    resolveOnce();

    expect((await nixChecker.check("nodejs")).installed).toBe(true);
    expect(mockExeca).toHaveBeenCalledWith("nix-env", ["-q", "--exact", "nodejs"]);
  });

  it("falls back to nix profile list and matches a whole token", async () => {
    rejectOnce();
    resolveOnce("0 flake:nixpkgs#legacyPackages.x86_64-linux.nodejs /nix/store/abc\n");

    expect((await nixChecker.check("nodejs")).installed).toBe(true);
    expect(mockExeca).toHaveBeenLastCalledWith("nix", ["profile", "list"]);
  });

  it("does not match a partial token in nix profile list", async () => {
    rejectOnce();
    resolveOnce("0 flake:nixpkgs#legacyPackages.x86_64-linux.nodejs-extra /nix/store/abc\n");

    expect((await nixChecker.check("nodejs")).installed).toBe(false);
  });

  it("returns false when both commands fail", async () => {
    rejectOnce();
    rejectOnce();

    expect((await nixChecker.check("nodejs")).installed).toBe(false);
  });
});
