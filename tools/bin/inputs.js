#!/usr/bin/env node
/**
 * Dev-tree CLI entry for inputs freshness tooling.
 * Materialized copy lives at .pythia/runtime/inputs.js (imports ./lib/inputs-core.js).
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../lib/references/inputs-core.js';

const entry = process.argv[1];
if (entry && resolve(entry) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
