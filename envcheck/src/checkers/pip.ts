import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const pipChecker = createSimpleChecker('pip', ['pip', 'show']);
