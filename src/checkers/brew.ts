import { execa } from 'execa';

export const brewChecker = {
  name: 'brew',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('brew', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      const { stdout } = await execa('brew', ['list']);
      // Brew list outputs one package per line
      const lines = stdout.split('\n');
      return lines.includes(pkg);
    } catch {
      return false;
    }
  }
};