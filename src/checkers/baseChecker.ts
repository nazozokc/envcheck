import { execa } from 'execa';
import type { Checker } from './index.js';

/**
 * Base checker utility to reduce code duplication for checkers that:
 * - Check availability by running a version-like command
 * - Check package by running a command that takes the package as an argument and exits with 0 if installed
 */
export const createSimpleChecker = (
  name: string,
  [command, ...args]: [string, ...string[]],
): Checker => {
  return {
    name,

    async isAvailable(): Promise<boolean> {
      try {
        await execa(command, ['--version']);
        return true;
      } catch {
        return false;
      }
    },

    async check(pkg: string): Promise<boolean> {
      try {
        await execa(command, [...args, pkg]);
        return true;
      } catch {
        return false;
      }
    },
  };
};

/**
 * Base checker utility for checkers that:
 * - Check availability by running a version-like command
 * - Check package by running a command that outputs a list of installed packages and checking if the package is in that list
 */
export const createListChecker = (
  name: string,
  [command, ...args]: [string, ...string[]],
): Checker => {
  return {
    name,

    async isAvailable(): Promise<boolean> {
      try {
        await execa(command, ['--version']);
        return true;
      } catch {
        return false;
      }
    },

    async check(pkg: string): Promise<boolean> {
      try {
        const { stdout } = await execa(command, args);
        const lines = stdout.trim().split('\n').map((line) => line.trim());
        return lines.includes(pkg);
      } catch {
        return false;
      }
    },
  };
};
