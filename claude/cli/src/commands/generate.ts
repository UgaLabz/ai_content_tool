import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { APIClient } from '../utils/api-client';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate text using AI models')
  .argument('<prompt>', 'The prompt to generate text from')
  .option('-t, --temperature <number>', 'Temperature for generation (0-2)', '0.7')
  .option('-m, --max-tokens <number>', 'Maximum tokens to generate', '1024')
  .option('-p, --provider <name>', 'Preferred provider (e.g., Ollama)')
  .option('--privacy', 'Force local-only providers for privacy')
  .option('-s, --stream', 'Stream the response')
  .option('--system <prompt>', 'System prompt to set context')
  .action(async (prompt, options) => {
    const api = new APIClient();
    
    // Check API health
    const spinner = ora('Checking API connection...').start();
    const healthy = await api.checkHealth();
    
    if (!healthy) {
      spinner.fail('API server is not running. Start it with: cd api && npm run dev');
      process.exit(1);
    }
    
    spinner.text = 'Generating text...';
    
    try {
      const generationOptions = {
        temperature: parseFloat(options.temperature),
        maxTokens: parseInt(options.maxTokens),
        systemPrompt: options.system,
      };
      
      const requirements: any = {};
      if (options.provider) requirements.preferredProvider = options.provider;
      if (options.privacy) requirements.privacy = true;
      
      if (options.stream) {
        spinner.stop();
        console.log(chalk.cyan('Streaming response:\n'));
        
        await api.generateStream(
          prompt,
          { ...generationOptions, requirements },
          (chunk) => process.stdout.write(chunk)
        );
        
        console.log('\n');
      } else {
        const result = await api.generateText(prompt, {
          options: generationOptions,
          requirements,
        });
        
        spinner.succeed('Generation complete');
        
        console.log(chalk.cyan('\n📝 Generated Text:'));
        console.log(result.text);
        
        console.log(chalk.gray(`\n📊 Metadata:`));
        console.log(chalk.gray(`  Model: ${result.model}`));
        console.log(chalk.gray(`  Provider: ${result.provider}`));
        console.log(chalk.gray(`  Latency: ${result.latency}ms`));
        
        if (result.usage) {
          console.log(chalk.gray(`  Tokens: ${result.usage.totalTokens} (${result.usage.promptTokens} prompt, ${result.usage.completionTokens} completion)`));
        }
      }
    } catch (error: any) {
      spinner.fail('Generation failed');
      console.error(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
      process.exit(1);
    }
  });