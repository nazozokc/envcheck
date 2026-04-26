import { execa } from 'execa';

export const pacmanChecker = {
  name: 'pacman',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('pacman', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      await execa('pacman', ['-Q', pkg]);
      return true;
    } catch {
      return false;
    }
  }
};