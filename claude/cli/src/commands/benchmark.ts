import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
const Table = require('cli-table3');
import { APIClient } from '../utils/api-client';

export const benchmarkCommand = new Command('benchmark')
  .alias('bench')
  .description('Benchmark available AI providers')
  .action(async () => {
    const api = new APIClient();
    const spinner = ora('Running benchmark tests...').start();
    
    try {
      const { benchmarks } = await api.benchmark();
      spinner.succeed('Benchmark complete');
      
      const table = new Table({
        head: [
          chalk.cyan('Provider'),
          chalk.cyan('Avg Latency'),
          chalk.cyan('Success Rate'),
          chalk.cyan('Total Tests'),
          chalk.cyan('Failed Tests'),
          chalk.cyan('Rating'),
        ],
        style: { head: [], border: [] },
      });
      
      // Sort by success rate and latency
      const sortedBenchmarks = benchmarks.sort((a: any, b: any) => {
        if (a.successRate === b.successRate) {
          return a.averageLatency - b.averageLatency;
        }
        return b.successRate - a.successRate;
      });
      
      sortedBenchmarks.forEach((bench: any, index: number) => {
        const successRate = `${(bench.successRate * 100).toFixed(1)}%`;
        const rating = getRating(bench.successRate, bench.averageLatency);
        
        table.push([
          index === 0 ? chalk.green(`🏆 ${bench.provider}`) : bench.provider,
          `${bench.averageLatency.toFixed(0)}ms`,
          successRate,
          bench.totalRequests,
          bench.failedRequests,
          rating,
        ]);
      });
      
      console.log('\n' + table.toString());
      console.log(chalk.gray('\nBenchmark uses a standard prompt to test each provider.'));
      console.log(chalk.gray('Lower latency and higher success rate = better performance.'));
    } catch (error: any) {
      spinner.fail('Benchmark failed');
      console.error(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
      process.exit(1);
    }
  });

function getRating(successRate: number, latency: number): string {
  const score = (successRate * 100) - (latency / 100);
  
  if (score >= 95) return '⭐⭐⭐⭐⭐';
  if (score >= 85) return '⭐⭐⭐⭐';
  if (score >= 75) return '⭐⭐⭐';
  if (score >= 60) return '⭐⭐';
  return '⭐';
}