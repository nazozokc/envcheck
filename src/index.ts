#!/usr/bin/env node
import { consola, createConsola } from "consola";
import { buildOutcome, printOutcome } from "./cli.js";
import type { Reporter } from "./cli.js";
import { checkers } from "./checkers/registry.js";
import { loadConfig } from "./config.js";
import type { EnvcheckConfig } from "./config.js";

let config: EnvcheckConfig;
try {
  config = await loadConfig(process.cwd());
} catch (error: unknown) {
  consola.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

const outcome = await buildOutcome(process.argv.slice(2), checkers, { config });
const logger = outcome.options.noColor
  ? createConsola({ formatOptions: { colors: false } })
  : consola;

const reporter: Reporter = {
  success: (message: string): void => {
    logger.success(message);
  },
  error: (message: string): void => {
    logger.error(message);
  },
  info: (message: string): void => {
    logger.info(message);
  },
  raw: (message: string): void => {
    process.stdout.write(`${message}\n`);
  },
};

process.exit(printOutcome(outcome, reporter));
