import type { Checker } from "./index.js";
import { nixChecker } from "./nix.js";
import { aptChecker } from "./apt.js";
import { pacmanChecker } from "./pacman.js";
import { scoopChecker } from "./scoop.js";
import { brewChecker } from "./brew.js";
import { wingetChecker } from "./winget.js";
import { dnfChecker } from "./dnf.js";
import { zypperChecker } from "./zypper.js";
import { apkChecker } from "./apk.js";
import { cargoChecker } from "./cargo.js";
import { pipChecker } from "./pip.js";
import { npmChecker } from "./npm.js";
import { gemChecker } from "./gem.js";
import { flatpakChecker } from "./flatpak.js";
import { snapChecker } from "./snap.js";
import { chocoChecker } from "./choco.js";
import { composerChecker } from "./composer.js";
import { dotnetChecker } from "./dotnet.js";
import { condaChecker } from "./conda.js";

export const checkers: Record<string, Checker> = {
  nix: nixChecker,
  apt: aptChecker,
  pacman: pacmanChecker,
  scoop: scoopChecker,
  brew: brewChecker,
  winget: wingetChecker,
  dnf: dnfChecker,
  zypper: zypperChecker,
  apk: apkChecker,
  cargo: cargoChecker,
  pip: pipChecker,
  npm: npmChecker,
  gem: gemChecker,
  flatpak: flatpakChecker,
  snap: snapChecker,
  choco: chocoChecker,
  composer: composerChecker,
  dotnet: dotnetChecker,
  conda: condaChecker,
};
