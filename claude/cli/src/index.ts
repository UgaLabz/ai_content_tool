#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { generateCommand } from './commands/generate';
import { chatCommand } from './commands/chat';
import { modelsCommand } from './commands/models';
import { benchmarkCommand } from './commands/benchmark';
import { configCommand } from './commands/config';
const packageJson = require('../package.json');
const version = packageJson.version;

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('ai-content')
  .description('CLI for AI Content Generator - Local and Cloud LLM Integration')
  .version(version);

// Add commands
program.addCommand(generateCommand);
program.addCommand(chatCommand);
program.addCommand(modelsCommand);
program.addCommand(benchmarkCommand);
program.addCommand(configCommand);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}