import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const cargoChecker = createSimpleChecker('cargo', ['cargo', 'install', '--list']);
