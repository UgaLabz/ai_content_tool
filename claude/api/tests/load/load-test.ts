import autocannon from 'autocannon';
import { logger } from '../../src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface LoadTestConfig {
  url: string;
  connections?: number;      // Concurrent connections
  pipelining?: number;       // Pipeline factor
  duration?: string;         // Test duration (e.g., '30s', '2m')
  amount?: number;          // Total requests
  timeout?: number;         // Request timeout
  headers?: Record<string, string>;
  title?: string;
  workers?: number;         // Worker threads
}

export interface LoadTestScenario {
  name: string;
  config: LoadTestConfig;
  requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body?: any;
    headers?: Record<string, string>;
  }>;
}

export class LoadTester {
  private results: any[] = [];
  
  /**
   * Run a single load test
   */
  async runTest(config: LoadTestConfig): Promise<any> {
    logger.info({ config }, 'Starting load test');
    
    const instance = autocannon({
      url: config.url,
      connections: config.connections || 10,
      pipelining: config.pipelining || 1,
      duration: config.duration || '30s',
      amount: config.amount,
      timeout: config.timeout || 30000,
      headers: config.headers,
      title: config.title,
      workers: config.workers || 1,
    });
    
    // Track progress
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
    });
    
    return new Promise((resolve, reject) => {
      instance.on('done', (result) => {
        this.results.push(result);
        logger.info({
          requests: result.requests,
          throughput: result.throughput,
          latency: result.latency,
          errors: result.errors,
        }, 'Load test completed');
        resolve(result);
      });
      
      instance.on('error', (err) => {
        logger.error({ error: err }, 'Load test failed');
        reject(err);
      });
    });
  }
  
  /**
   * Run multiple test scenarios
   */
  async runScenarios(scenarios: LoadTestScenario[]): Promise<any[]> {
    const results = [];
    
    for (const scenario of scenarios) {
      logger.info({ scenario: scenario.name }, 'Running scenario');
      
      try {
        const result = await this.runTest(scenario.config);
        results.push({
          scenario: scenario.name,
          result,
        });
      } catch (error) {
        logger.error({ scenario: scenario.name, error }, 'Scenario failed');
        results.push({
          scenario: scenario.name,
          error,
        });
      }
    }
    
    return results;
  }
  
  /**
   * Generate HTML report
   */
  async generateReport(outputPath: string): Promise<void> {
    const html = this.generateHTMLReport();
    await fs.writeFile(outputPath, html, 'utf-8');
    logger.info({ path: outputPath }, 'Load test report generated');
  }
  
  /**
   * Generate CSV data
   */
  async exportCSV(outputPath: string): Promise<void> {
    const csv = this.generateCSVData();
    await fs.writeFile(outputPath, csv, 'utf-8');
    logger.info({ path: outputPath }, 'Load test CSV exported');
  }
  
  private generateHTMLReport(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { font-weight: bold; }
    .good { color: green; }
    .warning { color: orange; }
    .bad { color: red; }
  </style>
</head>
<body>
  <h1>Load Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  ${this.results.map(result => `
    <h2>${result.title || 'Load Test'}</h2>
    
    <h3>Summary</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Requests</td>
        <td class="metric">${result.requests.total}</td>
      </tr>
      <tr>
        <td>Requests/sec</td>
        <td class="metric">${result.requests.average.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Bytes/sec</td>
        <td class="metric">${result.throughput.average.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Errors</td>
        <td class="metric ${result.errors ? 'bad' : 'good'}">${result.errors || 0}</td>
      </tr>
      <tr>
        <td>Timeouts</td>
        <td class="metric ${result.timeouts ? 'bad' : 'good'}">${result.timeouts || 0}</td>
      </tr>
    </table>
    
    <h3>Latency (ms)</h3>
    <table>
      <tr>
        <th>Percentile</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Mean</td>
        <td class="metric">${result.latency.mean.toFixed(2)}</td>
      </tr>
      <tr>
        <td>50%</td>
        <td class="metric">${result.latency.p50.toFixed(2)}</td>
      </tr>
      <tr>
        <td>90%</td>
        <td class="metric">${result.latency.p90.toFixed(2)}</td>
      </tr>
      <tr>
        <td>95%</td>
        <td class="metric">${result.latency.p95.toFixed(2)}</td>
      </tr>
      <tr>
        <td>99%</td>
        <td class="metric ${result.latency.p99 > 1000 ? 'warning' : ''}">${result.latency.p99.toFixed(2)}</td>
      </tr>
      <tr>
        <td>99.9%</td>
        <td class="metric ${result.latency.p999 > 5000 ? 'bad' : ''}">${result.latency.p999.toFixed(2)}</td>
      </tr>
    </table>
  `).join('')}
  
</body>
</html>
    `;
  }
  
  private generateCSVData(): string {
    const headers = [
      'Test',
      'Total Requests',
      'Requests/sec',
      'Bytes/sec',
      'Errors',
      'Timeouts',
      'Mean Latency',
      'P50 Latency',
      'P90 Latency',
      'P95 Latency',
      'P99 Latency',
    ];
    
    const rows = this.results.map(result => [
      result.title || 'Load Test',
      result.requests.total,
      result.requests.average.toFixed(2),
      result.throughput.average.toFixed(2),
      result.errors || 0,
      result.timeouts || 0,
      result.latency.mean.toFixed(2),
      result.latency.p50.toFixed(2),
      result.latency.p90.toFixed(2),
      result.latency.p95.toFixed(2),
      result.latency.p99.toFixed(2),
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Predefined test scenarios
export const scenarios = {
  // Basic health check
  healthCheck: {
    name: 'Health Check',
    config: {
      url: 'http://localhost:3000',
      connections: 10,
      duration: '10s',
      title: 'Health Check Endpoint',
    },
    requests: [{
      method: 'GET' as const,
      path: '/health',
    }],
  },
  
  // Light text generation
  lightGeneration: {
    name: 'Light Text Generation',
    config: {
      url: 'http://localhost:3000',
      connections: 5,
      duration: '30s',
      title: 'Light Generation Load',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    requests: [{
      method: 'POST' as const,
      path: '/api/generate',
      body: JSON.stringify({
        prompt: 'Write a haiku about technology',
        options: {
          maxTokens: 50,
          temperature: 0.7,
        },
      }),
    }],
  },
  
  // Heavy text generation
  heavyGeneration: {
    name: 'Heavy Text Generation',
    config: {
      url: 'http://localhost:3000',
      connections: 2,
      duration: '60s',
      title: 'Heavy Generation Load',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    requests: [{
      method: 'POST' as const,
      path: '/api/generate',
      body: JSON.stringify({
        prompt: 'Write a detailed technical article about distributed systems',
        options: {
          maxTokens: 1000,
          temperature: 0.8,
        },
      }),
    }],
  },
  
  // Character-based generation
  characterGeneration: {
    name: 'Character Generation',
    config: {
      url: 'http://localhost:3000',
      connections: 3,
      duration: '30s',
      title: 'Character-based Generation',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    requests: [{
      method: 'POST' as const,
      path: '/api/generate/character',
      body: JSON.stringify({
        prompt: 'What do you think about this?',
        characterId: 'test-character',
        options: {
          maxTokens: 200,
          enforceConsistency: true,
        },
      }),
    }],
  },
  
  // Mixed workload
  mixedWorkload: {
    name: 'Mixed Workload',
    config: {
      url: 'http://localhost:3000',
      connections: 10,
      duration: '120s',
      title: 'Mixed API Workload',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    requests: [
      {
        method: 'GET' as const,
        path: '/health',
      },
      {
        method: 'GET' as const,
        path: '/api/models',
      },
      {
        method: 'POST' as const,
        path: '/api/generate',
        body: JSON.stringify({
          prompt: 'Hello, how are you?',
          options: { maxTokens: 50 },
        }),
      },
    ],
  },
};

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenarioName = args[0] || 'healthCheck';
  const outputDir = args[1] || './load-test-results';
  
  (async () => {
    const tester = new LoadTester();
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      const scenario = (scenarios as any)[scenarioName];
      if (!scenario) {
        console.error(`Unknown scenario: ${scenarioName}`);
        console.log('Available scenarios:', Object.keys(scenarios).join(', '));
        process.exit(1);
      }
      
      await tester.runScenarios([scenario]);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await tester.generateReport(path.join(outputDir, `report-${timestamp}.html`));
      await tester.exportCSV(path.join(outputDir, `results-${timestamp}.csv`));
      
      console.log('Load test completed successfully');
    } catch (error) {
      console.error('Load test failed:', error);
      process.exit(1);
    }
  })();
}