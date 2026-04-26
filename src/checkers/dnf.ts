import { execa } from 'execa';

export const dnfChecker = {
  name: 'dnf',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('dnf', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      await execa('dnf', ['list', 'installed', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};