import { execa } from 'execa';

export const apkChecker = {
  name: 'apk',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('apk', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      await execa('apk', ['info', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};