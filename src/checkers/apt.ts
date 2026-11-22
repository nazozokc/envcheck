import { createOutputChecker } from './baseChecker.js';

export const aptChecker = createOutputChecker(
  'apt',
  ['dpkg-query', '-W', '-f=${Status}'],
  (stdout: string): boolean => stdout.trim() === 'install ok installed',
);
