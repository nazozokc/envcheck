import { createOutputChecker, firstColumn } from './baseChecker.js';

export const condaChecker = createOutputChecker(
  'conda',
  ['conda', 'list'],
  (stdout: string, pkg: string): boolean =>
    stdout.split('\n').map(firstColumn).includes(pkg),
);
