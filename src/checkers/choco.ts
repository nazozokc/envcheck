import { createOutputChecker, firstColumn } from './baseChecker.js';

export const chocoChecker = createOutputChecker(
  'choco',
  ['choco', 'list', '--local-only', '--exact'],
  (stdout: string, pkg: string): boolean =>
    stdout.split('\n').map(firstColumn).includes(pkg),
);
