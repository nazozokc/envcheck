import { execa } from 'execa';
import { createSimpleChecker } from './baseChecker';

export const apkChecker = createSimpleChecker('apk', ['apk']);
