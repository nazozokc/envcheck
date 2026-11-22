import { createSimpleChecker } from './baseChecker.js';

export const cargoChecker = createSimpleChecker('cargo', ['cargo', 'install', '--list']);
