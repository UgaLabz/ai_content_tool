import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.ai-content');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiUrl?: string;
  defaultProvider?: string;
  privacyMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export const configCommand = new Command('config')
  .description('Configure CLI settings')
  .option('-l, --list', 'List current configuration')
  .option('-r, --reset', 'Reset to default configuration')
  .action(async (options) => {
    if (options.list) {
      await listConfig();
    } else if (options.reset) {
      await resetConfig();
    } else {
      await interactiveConfig();
    }
  });

// Sub-command to set specific values
configCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action(async (key, value) => {
    const config = await loadConfig();
    
    switch (key) {
      case 'apiUrl':
        config.apiUrl = value;
        break;
      case 'defaultProvider':
        config.defaultProvider = value;
        break;
      case 'privacyMode':
        config.privacyMode = value === 'true';
        break;
      case 'temperature':
        config.temperature = parseFloat(value);
        break;
      case 'maxTokens':
        config.maxTokens = parseInt(value);
        break;
      default:
        console.error(chalk.red(`Unknown configuration key: ${key}`));
        process.exit(1);
    }
    
    await saveConfig(config);
    console.log(chalk.green(`✓ Set ${key} = ${value}`));
  });

async function loadConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function listConfig(): Promise<void> {
  const config = await loadConfig();
  
  console.log(chalk.cyan('\n🔧 Current Configuration:'));
  console.log(chalk.gray('─'.repeat(40)));
  
  const defaults = {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    defaultProvider: 'auto',
    privacyMode: false,
    temperature: 0.7,
    maxTokens: 1024,
  };
  
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = config[key as keyof Config] ?? defaultValue;
    const isDefault = value === defaultValue;
    
    console.log(
      chalk.blue(`${key}:`),
      isDefault ? chalk.gray(value) : chalk.yellow(value),
      isDefault ? chalk.gray('(default)') : ''
    );
  }
  
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.gray(`Config file: ${CONFIG_FILE}`));
}

async function resetConfig(): Promise<void> {
  try {
    await fs.unlink(CONFIG_FILE);
    console.log(chalk.green('✓ Configuration reset to defaults'));
  } catch {
    console.log(chalk.yellow('No configuration file found'));
  }
}

async function interactiveConfig(): Promise<void> {
  const config = await loadConfig();
  
  console.log(chalk.cyan('\n🔧 Configure AI Content CLI'));
  console.log(chalk.gray('Press Enter to keep current values\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: 'API URL:',
      default: config.apiUrl || process.env.API_URL || 'http://localhost:3000',
    },
    {
      type: 'list',
      name: 'defaultProvider',
      message: 'Default Provider:',
      choices: ['auto', 'Ollama', 'LMStudio', 'LocalAI', 'OpenAI', 'Claude'],
      default: config.defaultProvider || 'auto',
    },
    {
      type: 'confirm',
      name: 'privacyMode',
      message: 'Privacy Mode (force local providers):',
      default: config.privacyMode || false,
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Default Temperature (0-2):',
      default: config.temperature || 0.7,
      validate: (value) => value >= 0 && value <= 2 || 'Must be between 0 and 2',
    },
    {
      type: 'number',
      name: 'maxTokens',
      message: 'Default Max Tokens:',
      default: config.maxTokens || 1024,
      validate: (value) => value > 0 || 'Must be greater than 0',
    },
  ]);
  
  await saveConfig(answers);
  console.log(chalk.green('\n✓ Configuration saved successfully'));
}