import { execa } from 'execa';

export const zypperChecker = {
  name: 'zypper',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('zypper', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      // zypper se --installed-only <package> returns 0 if found
      await execa('zypper', ['se', '--installed-only', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};