import { createSimpleChecker } from './baseChecker.js';

export const aptChecker = createSimpleChecker('apt', ['dpkg']);
