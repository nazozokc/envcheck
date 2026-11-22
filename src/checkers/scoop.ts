import { createListChecker, firstColumn } from './baseChecker.js';

export const scoopChecker = createListChecker('scoop', ['scoop', 'list'], firstColumn);
