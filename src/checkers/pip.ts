import { createSimpleChecker } from './baseChecker.js';

export const pipChecker = createSimpleChecker('pip', ['pip', 'show']);
