import { createListChecker } from './baseChecker.js';

export const flatpakChecker = createListChecker('flatpak', [
  'flatpak',
  'list',
  '--app',
  '--columns=application',
]);
