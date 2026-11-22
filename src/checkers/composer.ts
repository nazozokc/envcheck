import { createSimpleChecker } from './baseChecker.js';

export const composerChecker = createSimpleChecker('composer', [
  'composer',
  'global',
  'show',
]);
