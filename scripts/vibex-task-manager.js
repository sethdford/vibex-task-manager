#!/usr/bin/env node
import { program } from 'commander';
import { setupCLI } from './modules/commands.js';

// Setup CLI commands
setupCLI();

// Parse command-line arguments
program.parse(process.argv);