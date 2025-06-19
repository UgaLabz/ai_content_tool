# Configuration Guide

## Quick Start

### 1. Default Configuration

When you first start the orchestrator, it creates a default configuration file at `config/orchestrator.json`:

```json
{
  "version": "1.0",
  "providers": [
    {
      "name": "Ollama",
      "priority": 80,
      "enabled": true,
      "costMultiplier": 1.0
    },
    {
      "name": "LMStudio", 
      "priority": 75,
      "enabled": true,
      "costMultiplier": 1.0
    },
    {
      "name": "LocalAI",
      "priority": 70,
      "enabled": true,
      "costMultiplier": 1.2
    }
  ],
  "costLimits": {
    "warningThreshold": 0.8,
    "actionOnLimit": "fallback"
  },
  "performanceThresholds": {
    "timeoutMs": 30000,
    "acceptableErrorRate": 0.05
  },
  "privacySettings": {
    "mode": "balanced",
    "allowCloudProviders": true,
    "allowDataLogging": false,
    "requireEncryption": true
  },
  "routingRules": [],
  "intelligenceEnabled": true,
  "resourceMonitoring": true,
  "metricsRetentionDays": 30,
  "debugMode": false
}
```

### 2. Environment Variables

Configure via environment variables in `.env`:

```bash
# Configuration
CONFIG_PATH=./config/orchestrator.json
CONFIG_AUTO_RELOAD=true
CONFIG_RELOAD_INTERVAL=60000

# Quick overrides
PRIVACY_MODE=false
DISABLE_INTELLIGENCE=false
ENABLE_RESOURCE_MONITORING=true
```

## Configuration Examples

### Example 1: Privacy-First Configuration

For handling sensitive data with maximum privacy:

```json
{
  "privacySettings": {
    "mode": "strict",
    "allowCloudProviders": false,
    "allowDataLogging": false,
    "requireEncryption": true,
    "excludeProviders": ["OpenAI", "Claude"]
  },
  "routingRules": [
    {
      "id": "force-local-only",
      "name": "Force Local Providers",
      "priority": 100,
      "enabled": true,
      "conditions": {},
      "actions": {
        "requiredProviderType": "local"
      }
    }
  ]
}
```

### Example 2: Performance-Optimized Configuration

For maximum speed and throughput:

```json
{
  "performanceThresholds": {
    "maxLatency": 2000,
    "minThroughput": 50,
    "timeoutMs": 10000
  },
  "providers": [
    {
      "name": "Ollama",
      "priority": 90,
      "enabled": true,
      "conditions": {
        "complexityRange": { "min": 1, "max": 5 }
      }
    }
  ],
  "routingRules": [
    {
      "id": "fast-simple-tasks",
      "name": "Use Small Models for Simple Tasks",
      "priority": 95,
      "enabled": true,
      "conditions": {
        "complexity": { "max": 3 },
        "tokenCount": { "max": 500 }
      },
      "actions": {
        "modelSizePreference": "small",
        "maxLatency": 1000
      }
    }
  ]
}
```

### Example 3: Cost-Optimized Configuration

For minimizing costs while maintaining quality:

```json
{
  "costLimits": {
    "maxCostPerRequest": 0.10,
    "maxCostPerHour": 5.00,
    "maxCostPerDay": 50.00,
    "maxCostPerMonth": 1000.00,
    "warningThreshold": 0.7,
    "actionOnLimit": "fallback"
  },
  "providers": [
    {
      "name": "Ollama",
      "priority": 95,
      "costMultiplier": 0.1
    },
    {
      "name": "OpenAI",
      "priority": 50,
      "costMultiplier": 10.0,
      "conditions": {
        "complexityRange": { "min": 8, "max": 10 }
      }
    }
  ]
}
```

### Example 4: Development Configuration

For development and testing:

```json
{
  "debugMode": true,
  "providers": [
    {
      "name": "Ollama",
      "priority": 100,
      "enabled": true
    }
  ],
  "costLimits": {
    "maxCostPerRequest": 10.00
  },
  "performanceThresholds": {
    "timeoutMs": 60000
  },
  "routingRules": [
    {
      "id": "dev-logging",
      "name": "Enable Verbose Logging",
      "priority": 100,
      "enabled": true,
      "conditions": {},
      "actions": {
        "preferredProvider": "Ollama"
      }
    }
  ]
}
```

## Routing Rules Cookbook

### Rule 1: Use Vision Models for Image Tasks

```json
{
  "id": "vision-for-images",
  "name": "Route Image Tasks to Vision Models",
  "priority": 90,
  "enabled": true,
  "conditions": {
    "requiresVision": true,
    "promptPattern": "(image|picture|photo|visual|describe.*see)"
  },
  "actions": {
    "preferredProvider": "LocalAI",
    "modelSizePreference": "medium"
  }
}
```

### Rule 2: Code Generation Optimization

```json
{
  "id": "code-gen-optimization",
  "name": "Optimize Code Generation",
  "priority": 85,
  "enabled": true,
  "conditions": {
    "taskType": "code",
    "promptPattern": "(write|create|implement|code|function|class)"
  },
  "actions": {
    "preferredProvider": "Ollama",
    "modelSizePreference": "medium",
    "maxLatency": 5000
  }
}
```

### Rule 3: Time-Based Load Balancing

```json
{
  "id": "business-hours-cloud",
  "name": "Use Cloud During Business Hours",
  "priority": 70,
  "enabled": true,
  "providers": [
    {
      "name": "OpenAI",
      "priority": 80,
      "conditions": {
        "timeOfDay": { "start": "09:00", "end": "17:00" }
      }
    },
    {
      "name": "Ollama",
      "priority": 90,
      "conditions": {
        "timeOfDay": { "start": "17:00", "end": "09:00" }
      }
    }
  ]
}
```

### Rule 4: Complexity-Based Routing

```json
{
  "id": "complexity-routing",
  "name": "Route by Task Complexity",
  "priority": 80,
  "enabled": true,
  "conditions": {
    "complexity": { "min": 7, "max": 10 }
  },
  "actions": {
    "modelSizePreference": "large",
    "preferredProvider": "Claude",
    "maxCost": 1.00
  }
}
```

## Advanced Configuration

### Dynamic Provider Management

```typescript
// Add provider at runtime
await orchestrator.updateProviderPreference('NewProvider', {
  priority: 60,
  enabled: true,
  conditions: {
    taskTypes: ['translation', 'summarization']
  }
});

// Temporarily disable a provider
await orchestrator.updateProviderPreference('OpenAI', {
  enabled: false
});
```

### Conditional Rules

```typescript
// Add time-sensitive rule
await orchestrator.addRoutingRule({
  id: 'weekend-local-only',
  name: 'Local Only on Weekends',
  priority: 85,
  enabled: true,
  conditions: {
    // Note: Time conditions are evaluated at runtime
  },
  actions: {
    requiredProviderType: 'local'
  }
});
```

### Performance Monitoring

```typescript
// Get performance report
const report = await fetch('/api/intelligence/report');
const data = await report.json();

// Adjust based on performance
if (data.performance.avgLatency > 3000) {
  await orchestrator.updateConfiguration({
    performanceThresholds: {
      maxLatency: 5000
    }
  });
}
```

## Configuration Validation

The configuration system validates all inputs using Zod schemas:

- **Provider names**: Must match registered providers
- **Priorities**: Must be 0-100
- **Time formats**: Must be "HH:MM"
- **Regex patterns**: Must be valid regular expressions
- **Cost values**: Must be positive numbers

Invalid configurations are rejected with detailed error messages.

## Troubleshooting Configuration

### Config Not Loading

1. Check JSON syntax:
```bash
jq . config/orchestrator.json
```

2. Verify permissions:
```bash
ls -la config/orchestrator.json
```

3. Check logs for validation errors

### Rules Not Matching

1. Enable debug mode:
```json
{ "debugMode": true }
```

2. Check rule conditions:
- Regex patterns are case-insensitive by default
- Complexity ranges are inclusive
- Time ranges work across midnight

3. Verify rule priority and enabled status

### Performance Issues

1. Review active rules count
2. Simplify complex regex patterns
3. Reduce configuration reload frequency
4. Check resource monitoring alerts

## Migration Guide

### From Environment Variables

```bash
# Old way
PRIVACY_MODE=true
MAX_COST_PER_REQUEST=1.0

# New way - in orchestrator.json
{
  "privacySettings": { "mode": "strict" },
  "costLimits": { "maxCostPerRequest": 1.0 }
}
```

### From Code Configuration

```typescript
// Old way
new IntelligentOrchestrator({
  privacyMode: true,
  costConstraints: { maxCostPerRequest: 1.0 }
});

// New way
new ConfigurableOrchestrator({
  configPath: './config/orchestrator.json'
});
```

---

Last updated: 2025-01-19