import { createListChecker, firstColumn } from './baseChecker.js';

export const snapChecker = createListChecker('snap', ['snap', 'list'], firstColumn);
