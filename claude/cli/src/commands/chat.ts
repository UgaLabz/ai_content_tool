import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { APIClient } from '../utils/api-client';

export const chatCommand = new Command('chat')
  .description('Start an interactive chat session')
  .option('-p, --provider <name>', 'Preferred provider (e.g., Ollama)')
  .option('--privacy', 'Force local-only providers for privacy')
  .option('-t, --temperature <number>', 'Temperature for generation (0-2)', '0.7')
  .option('-c, --character <id>', 'Use a specific character profile')
  .option('--system <prompt>', 'System prompt to set context')
  .action(async (options) => {
    const api = new APIClient();
    
    // Check API health
    const spinner = ora('Connecting to API...').start();
    const healthy = await api.checkHealth();
    
    if (!healthy) {
      spinner.fail('API server is not running. Start it with: cd api && npm run dev');
      process.exit(1);
    }
    
    spinner.succeed('Connected to API');
    
    console.log(chalk.cyan('\n🤖 AI Chat Session Started'));
    console.log(chalk.gray('Type "exit" or press Ctrl+C to quit\n'));
    
    const sessionId = `cli-${Date.now()}`;
    const conversationHistory: any[] = [];
    
    if (options.system) {
      conversationHistory.push({
        role: 'system',
        content: options.system,
      });
    }
    
    while (true) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: chalk.green('You:'),
          validate: (input) => input.trim().length > 0 || 'Please enter a message',
        },
      ]);
      
      if (message.toLowerCase() === 'exit') {
        console.log(chalk.yellow('\nGoodbye! 👋'));
        break;
      }
      
      const chatSpinner = ora('Thinking...').start();
      
      try {
        const result = await api.chat(message, {
          sessionId,
          characterId: options.character,
          conversationHistory,
        }, {
          temperature: parseFloat(options.temperature),
        });
        
        chatSpinner.stop();
        
        conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: result.response }
        );
        
        console.log(chalk.blue('\nAssistant:'), result.response);
        console.log(chalk.gray(`\n[${result.provider} - ${result.model}]`));
        console.log('');
      } catch (error: any) {
        chatSpinner.fail('Failed to get response');
        console.error(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
      }
    }
  });