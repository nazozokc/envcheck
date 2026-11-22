import { createListChecker, firstColumn } from './baseChecker.js';

export const dotnetChecker = createListChecker(
  'dotnet',
  ['dotnet', 'tool', 'list', '-g'],
  firstColumn,
);
