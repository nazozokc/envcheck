import { createListChecker, firstColumn } from './baseChecker.js';

export const cargoChecker = createListChecker(
  'cargo',
  ['cargo', 'install', '--list'],
  firstColumn,
);
