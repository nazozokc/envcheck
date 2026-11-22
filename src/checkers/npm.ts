import { createSimpleChecker } from './baseChecker.js';

export const npmChecker = createSimpleChecker('npm', ['npm', 'ls', '-g', '--depth=0']);
