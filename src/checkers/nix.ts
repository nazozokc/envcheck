import { execa } from 'execa';

export const nixChecker = {
  name: 'nix',
  
  async isAvailable(): Promise<boolean> {
    try {
      await execa('nix', ['--version']);
      return true;
    } catch {
      return false;
    }
  },
  
  async check(pkg: string): Promise<boolean> {
    try {
      // Try nix-env -q first
      await execa('nix-env', ['-q', pkg]);
      return true;
    } catch {
      try {
        // Fallback to nix profile list
        const { stdout } = await execa('nix', ['profile', 'list']);
        return stdout.includes(pkg);
      } catch {
        return false;
      }
    }
  }
};
