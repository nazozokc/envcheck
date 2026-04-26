import { execa } from 'execa';

export const scoopChecker = {
  name: 'scoop',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('scoop', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      const { stdout } = await execa('scoop', ['list']);
      // Scoop list output format: name version
      // We'll check if the package name appears in the list (first column)
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.trim() && line.split(/\s+/)[0] === pkg) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
};