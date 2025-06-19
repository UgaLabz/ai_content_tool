import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
const Table = require('cli-table3');
import { APIClient } from '../utils/api-client';

export const modelsCommand = new Command('models')
  .description('Manage and list AI models')
  .option('-p, --providers', 'Show provider status')
  .action(async (options) => {
    const api = new APIClient();
    const spinner = ora('Fetching model information...').start();
    
    try {
      if (options.providers) {
        const { providers } = await api.listProviders();
        spinner.succeed('Provider information fetched');
        
        const table = new Table({
          head: [
            chalk.cyan('Provider'),
            chalk.cyan('Type'),
            chalk.cyan('Status'),
            chalk.cyan('Latency'),
            chalk.cyan('Success Rate'),
            chalk.cyan('Total Requests'),
          ],
          style: { head: [], border: [] },
        });
        
        for (const provider of providers) {
          const status = provider.healthy 
            ? chalk.green('✓ Healthy') 
            : chalk.red('✗ Unhealthy');
          
          const successRate = provider.metrics 
            ? `${(provider.metrics.successRate * 100).toFixed(1)}%`
            : 'N/A';
          
          table.push([
            provider.name,
            provider.type,
            status,
            provider.latency ? `${provider.latency}ms` : 'N/A',
            successRate,
            provider.metrics?.totalRequests || 0,
          ]);
        }
        
        console.log('\n' + table.toString());
      } else {
        const { models } = await api.listModels();
        spinner.succeed(`Found ${models.length} models`);
        
        const table = new Table({
          head: [
            chalk.cyan('Model ID'),
            chalk.cyan('Provider'),
            chalk.cyan('Type'),
            chalk.cyan('Size'),
            chalk.cyan('Context'),
            chalk.cyan('Features'),
          ],
          style: { head: [], border: [] },
          wordWrap: true,
          colWidths: [30, 12, 8, 10, 10, 20],
        });
        
        for (const model of models) {
          const features = [];
          if (model.capabilities.supportsStreaming) features.push('streaming');
          if (model.capabilities.supportsVision) features.push('vision');
          if (model.capabilities.supportsFunctions) features.push('functions');
          
          table.push([
            model.id,
            model.provider,
            model.type,
            model.size,
            `${model.capabilities.contextWindow}`,
            features.join(', ') || 'none',
          ]);
        }
        
        console.log('\n' + table.toString());
        console.log(chalk.gray(`\nTip: Use --providers to see provider health status`));
      }
    } catch (error: any) {
      spinner.fail('Failed to fetch model information');
      console.error(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
      process.exit(1);
    }
  });

// Add sub-command for pulling models
modelsCommand
  .command('pull <model>')
  .description('Pull a model (Ollama only)')
  .action(async (model) => {
    console.log(chalk.yellow('Note: Model pulling via CLI is not yet implemented.'));
    console.log(chalk.gray('Please use: ollama pull ' + model));
  });

// Add sub-command for listing available models to pull
modelsCommand
  .command('available')
  .description('List available models to download')
  .action(async () => {
    console.log(chalk.cyan('\n📦 Available Ollama Models:'));
    console.log(chalk.gray('Visit https://ollama.ai/library for the full list\n'));
    
    const popularModels = [
      { name: 'llama3.1:8b', desc: 'Meta Llama 3.1 8B - General purpose' },
      { name: 'llama3.1:70b', desc: 'Meta Llama 3.1 70B - Advanced reasoning' },
      { name: 'mistral:7b', desc: 'Mistral 7B - Fast and efficient' },
      { name: 'mixtral:8x7b', desc: 'Mixtral MoE - Multi-task expert' },
      { name: 'gemma:2b', desc: 'Google Gemma 2B - Lightweight' },
      { name: 'deepseek-r1:7b', desc: 'DeepSeek R1 - Reasoning focused' },
      { name: 'codellama:7b', desc: 'Code Llama - Code generation' },
      { name: 'phi3:mini', desc: 'Microsoft Phi-3 - Small but capable' },
    ];
    
    const table = new Table({
      head: [chalk.cyan('Model'), chalk.cyan('Description')],
      style: { head: [], border: [] },
    });
    
    popularModels.forEach(model => {
      table.push([model.name, model.desc]);
    });
    
    console.log(table.toString());
    console.log(chalk.gray('\nTo pull a model: ollama pull <model-name>'));
  });