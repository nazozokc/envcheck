import { createSimpleChecker } from './baseChecker.js';

export const gemChecker = createSimpleChecker('gem', ['gem', 'list', '-i', '-e']);
