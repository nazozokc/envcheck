import { execa } from 'execa';

export const cargoChecker = {
  name: 'cargo',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('cargo', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      const { stdout } = await execa('cargo', ['install', '--list']);
      // Cargo install list output format: package_name vversion (package_name vversion)
      // We'll check if the package name appears in the list
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