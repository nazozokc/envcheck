import { createSimpleChecker } from './baseChecker.js';

export const dnfChecker = createSimpleChecker('dnf', ['dnf', '-q', 'list', 'installed']);
