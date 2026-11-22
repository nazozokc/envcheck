import { createListChecker, firstColumn } from './baseChecker.js';

export const wingetChecker = createListChecker('winget', ['winget', 'list'], firstColumn);