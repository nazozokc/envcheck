import { ExecaError, ExecaReturnValue } from 'execa';

/**
 * Base checker utility to reduce code duplication for checkers that:
 * - Check availability by running a version-like command
 * - Check package by running a command that takes the package as an argument and exits with 0 if installed
 */
export const createSimpleChecker = (name: string, baseCommand: string[]) => {
  return {
    name,
    
    async isAvailable(): Promise<boolean> {
      try {
        // Try to get version to check availability
        const versionCmd = [...baseCommand.slice(0, 1), '--version'];
        await execa(versionCmd[0], versionCmd.slice(1));
        return true;
      } catch {
        return false;
      }
    },
    
    async check(pkg: string): Promise<boolean> {
      try {
        await execa(baseCommand[0], [...baseCommand.slice(1), pkg]);
        return true;
      } catch {
        return false;
      }
    }
  };
};

/**
 * Base checker utility for checkers that:
 * - Check availability by running a version-like command
 * - Check package by running a command that outputs a list of installed packages and checking if the package is in that list
 */
export const createListChecker = (name: string, listCommand: string[]) => {
  return {
    name,
    
    async isAvailable(): Promise<boolean> {
      try {
        // Try to get version to check availability
        const versionCmd = [...listCommand.slice(0, 1), '--version'];
        await execa(versionCmd[0], versionCmd.slice(1));
        return true;
      } catch {
        return false;
      }
    },
    
    async check(pkg: string): Promise<boolean> {
      try {
        const { stdout } = await execa(listCommand[0], listCommand.slice(1));
        const lines = stdout.trim().split('\n').map(line => line.trim());
        return lines.includes(pkg);
      } catch {
        return false;
      }
    }
  };
};

// Import execa here to avoid circular dependencies
import { execa } from 'execa';
