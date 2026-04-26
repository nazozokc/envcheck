import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const aptChecker = createSimpleChecker('apt', ['dpkg']);
