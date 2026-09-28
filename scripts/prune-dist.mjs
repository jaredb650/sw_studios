#!/usr/bin/env node
// Runs after `astro build`: deletes built files in dist/_astro that no page,
// stylesheet or script refers to (for example the full-size originals of
// images the site only shows resized). They would never be downloaded, but
// they'd still be uploaded on every deploy.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const files = walk(DIST);
const TEXT = /\.(html|css|js|mjs|json|xml|txt|webmanifest|svg)$/;
const references = files.filter((file) => TEXT.test(file)).map((file) => fs.readFileSync(file, 'utf8')).join('\n');

let removed = 0;
let bytes = 0;
for (const file of files) {
  if (!file.startsWith(path.join(DIST, '_astro') + path.sep) || TEXT.test(file)) continue;
  if (references.includes(path.basename(file))) continue;
  bytes += fs.statSync(file).size;
  fs.rmSync(file);
  removed++;
}
console.log(`prune-dist: removed ${removed} unreferenced files (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
