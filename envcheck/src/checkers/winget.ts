import { execa } from 'execa';

export const wingetChecker = {
  name: 'winget',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('winget', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      const { stdout } = await execa('winget', ['list']);
      // Winget list output format: Id Version Available Source
      // We'll check if the package Id appears in the list
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