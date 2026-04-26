import { execa } from 'execa';

export const pipChecker = {
  name: 'pip',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('pip', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      await execa('pip', ['show', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};