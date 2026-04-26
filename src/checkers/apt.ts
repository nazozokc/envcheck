import { execa } from 'execa';

export const aptChecker = {
  name: 'apt',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('dpkg', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      await execa('dpkg', ['-l', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};