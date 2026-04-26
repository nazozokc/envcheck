import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const dnfChecker = createSimpleChecker('dnf', ['dnf']);
