import { createOutputChecker } from './baseChecker.js';

export const zypperChecker = createOutputChecker(
  'zypper',
  ['zypper', '--quiet', 'se', '--installed-only', '--exact'],
  (stdout: string, pkg: string): boolean =>
    stdout.split('\n').some((line: string): boolean => line.split(/\s+/).includes(pkg)),
);
