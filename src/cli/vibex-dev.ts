#!/usr/bin/env node

import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const interactiveUIPath = path.resolve(__dirname, 'interactive.cjs');
const args = process.argv.slice(2);

execa('node', [interactiveUIPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
}).catch(error => {
  if (error.exitCode !== 0 && !error.isCanceled) {
    console.error('The interactive session exited unexpectedly.');
  }
}); 