import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const pacmanChecker = createSimpleChecker('pacman', ['pacman']);
