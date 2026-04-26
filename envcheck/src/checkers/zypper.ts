import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const zypperChecker = createSimpleChecker('zypper', ['zypper']);
