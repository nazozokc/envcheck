#!/usr/bin/env bun

import { Command } from 'commander';
import { consola } from 'consola';
import { nixChecker } from './checkers/nix.js';
import { aptChecker } from './checkers/apt.js';
import { pacmanChecker } from './checkers/pacman.js';
import { scoopChecker } from './checkers/scoop.js';
import { brewChecker } from './checkers/brew.js';
import { wingetChecker } from './checkers/winget.js';
import { dnfChecker } from './checkers/dnf.js';
import { zypperChecker } from './checkers/zypper.js';
import { apkChecker } from './checkers/apk.js';
import { cargoChecker } from './checkers/cargo.js';
import { pipChecker } from './checkers/pip.js';

// Map of checker names to checker instances
const checkers: Record<string, any> = {
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
};

const program = new Command();

program
  .name('envcheck')
  .description('CLI tool to check if packages are installed via various package managers')
  .argument('<manager>', 'package manager to use (nix, apt, pacman, scoop, brew, winget, dnf, zypper, apk, cargo, pip)')
  .argument('<packages...>', 'packages to check')
  .action(async (manager, packages) => {
    const checker = checkers[manager];

    if (!checker) {
      consola.error(`Unsupported package manager: ${manager}`);
      consola.info(`Supported managers: ${Object.keys(checkers).join(', ')}`);
      process.exit(2);
    }

    if (!await checker.isAvailable()) {
      consola.error(`${manager} is not available on this system`);
      process.exit(2);
    }

    let allOk = true;

    for (const pkg of packages) {
      const isInstalled = await checker.check(pkg);
      const status = isInstalled ? 'OK' : 'NG';
      const color = isInstalled ? 'green' : 'red';
      
      // Pad package name for alignment (max 20 chars)
      const paddedPkg = pkg.padEnd(20);
      consola[color](`[${manager}] ${paddedPkg} ... ${status}`);
      
      if (!isInstalled) {
        allOk = false;
      }
    }

    process.exit(allOk ? 0 : 1);
  });

program.parse();