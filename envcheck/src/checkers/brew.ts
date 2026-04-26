import { execa } from 'execa';
import { createListChecker } from './baseChecker';

export const brewChecker = createListChecker('brew', ['brew', 'list']);
