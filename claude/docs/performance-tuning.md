# Performance Tuning Guide

## Overview

This guide covers performance optimization techniques for the AI Content Tool, focusing on maximizing throughput, minimizing latency, and efficient resource utilization.

## Performance Optimizations Implemented

### 1. Caching System

#### Prompt Caching
- **Purpose**: Avoid regenerating responses for identical prompts
- **Implementation**: LRU cache with SHA-256 keys
- **Configuration**:
  ```env
  DISABLE_CACHING=false         # Enable caching (default: enabled)
  CACHE_MAX_SIZE=5000          # Maximum cache entries
  CACHE_TTL=3600000            # Cache TTL in ms (1 hour)
  ```

#### Embedding Caching
- **Purpose**: Reuse embeddings for similar text
- **Storage**: 200MB dedicated memory
- **TTL**: 24 hours

#### Usage Example
```javascript
// Automatic caching for all requests
const response = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Hello world', // Cached after first request
    options: { temperature: 0.7 }
  })
});
```

### 2. Connection Pooling

#### HTTP Connection Pools
- **Purpose**: Reuse HTTP connections to LLM providers
- **Benefits**: Reduced connection overhead, better throughput
- **Configuration**:
  ```env
  ENABLE_CONNECTION_POOLING=true
  POOL_MIN_CONNECTIONS=2
  POOL_MAX_CONNECTIONS=10
  ```

#### Pool Statistics
```bash
# View pool stats
curl http://localhost:3000/api/performance/stats
```

### 3. Request Batching

#### Batch Processing
- **Purpose**: Group multiple small requests for efficiency
- **Ideal for**: High-volume, low-latency requirements
- **Configuration**:
  ```env
  ENABLE_BATCHING=true
  BATCH_MAX_SIZE=10
  BATCH_MAX_WAIT=100  # ms
  ```

#### When Batching Occurs
- Small requests (< 500 tokens)
- Non-streaming requests
- Non-character requests
- Low/medium priority

### 4. Response Compression

#### Compression Algorithms
- **Brotli**: Best compression ratio (default for modern browsers)
- **Gzip**: Wide compatibility
- **Deflate**: Legacy support

#### Configuration
```env
COMPRESSION_THRESHOLD=1024    # Minimum size to compress (bytes)
COMPRESSION_LEVEL=6          # 1-9 (speed vs ratio)
```

#### Headers
```http
Accept-Encoding: br, gzip, deflate
Content-Encoding: br
```

### 5. Prompt Optimization

#### Automatic Optimization
- **Whitespace removal**: Multiple spaces → single space
- **Redundancy removal**: Common redundant phrases
- **Token reduction**: Intelligent truncation

#### Compression Levels
- **Light**: Minimal changes, preserve all meaning
- **Moderate**: Remove redundancies, optimize structure
- **Aggressive**: Maximum compression, may alter style

#### Example
```javascript
// Original: 850 tokens
"Please could you kindly help me to understand..."

// Optimized: 650 tokens (23% reduction)
"Help me understand..."
```

### 6. Performance Monitoring

#### Real-time Metrics
- CPU and memory usage
- Request latency (p50, p95, p99)
- Model-specific performance
- Throughput (requests/sec, tokens/sec)

#### Alerts
```env
ALERT_CPU_THRESHOLD=80        # CPU usage %
ALERT_MEMORY_THRESHOLD=85     # Memory usage %
ALERT_ERROR_RATE=5           # Error rate %
ALERT_LATENCY_P95=5000       # P95 latency ms
```

## Performance Tuning Strategies

### 1. Model Selection

#### By Size vs Performance
| Model Size | Latency | Quality | Use Case |
|------------|---------|---------|----------|
| 2-3B | <100ms | 70% | Simple queries |
| 7-8B | 200-500ms | 85% | General use |
| 13B | 500-1000ms | 90% | Complex tasks |
| 70B | 2-5s | 95% | High quality |

#### Automatic Model Selection
```javascript
// Let orchestrator choose optimal model
const response = await generate({
  prompt: "Quick greeting",
  requirements: {
    maxLatency: 200,  // Forces small model
  }
});
```

### 2. Context Window Management

#### Strategies
1. **Sliding Window**: Keep most recent N messages
2. **Importance-based**: Prioritize by relevance
3. **Compression**: Optimize older messages

#### Configuration
```javascript
// Optimize conversation context
const optimizer = new ConversationOptimizer();
const optimized = await optimizer.optimizeConversation(
  messages,
  4096  // Target token count
);
```

### 3. Load Balancing

#### Provider Distribution
```javascript
// Configure routing rules
{
  "routing": {
    "rules": [
      {
        "name": "small-requests-to-fast-models",
        "condition": { "maxTokens": { "lte": 100 } },
        "action": { "preferredModels": ["gemma-2b", "llama3.1:8b"] }
      }
    ]
  }
}
```

### 4. Resource Management

#### Memory Optimization
- **Model unloading**: Auto-unload after idle timeout
- **Garbage collection**: Aggressive GC for large models
- **Memory limits**: Per-model memory quotas

#### GPU Utilization
```bash
# Monitor GPU usage
nvidia-smi dmon -s u

# Set GPU memory fraction
export CUDA_VISIBLE_DEVICES=0
export TF_FORCE_GPU_ALLOW_GROWTH=true
```

## Load Testing

### Running Load Tests

```bash
# Basic health check
npm run load-test healthCheck

# Light generation load
npm run load-test lightGeneration

# Heavy generation load
npm run load-test heavyGeneration

# Mixed workload
npm run load-test mixedWorkload
```

### Custom Load Test
```javascript
const tester = new LoadTester();
await tester.runTest({
  url: 'http://localhost:3000',
  connections: 10,
  duration: '30s',
  pipelining: 1,
});
```

### Interpreting Results

#### Good Performance Indicators
- P95 latency < 1 second
- P99 latency < 5 seconds
- Error rate < 1%
- CPU usage < 80%
- Memory usage < 85%

#### Warning Signs
- P99 latency > 10 seconds
- Error rate > 5%
- CPU consistently > 90%
- Memory pressure warnings
- Connection pool exhaustion

## Optimization Checklist

### Before Deployment

- [ ] Enable compression for responses > 1KB
- [ ] Configure connection pooling
- [ ] Set appropriate cache TTLs
- [ ] Enable prompt optimization
- [ ] Configure model selection rules
- [ ] Set resource limits
- [ ] Enable performance monitoring
- [ ] Run load tests
- [ ] Configure alerts

### Runtime Optimization

- [ ] Monitor cache hit rates
- [ ] Check connection pool utilization
- [ ] Review batch processing efficiency
- [ ] Analyze prompt optimization savings
- [ ] Track model performance metrics
- [ ] Monitor resource usage trends

### Periodic Maintenance

```bash
# Clear stale cache entries
curl -X POST http://localhost:3000/api/maintenance

# View performance stats
curl http://localhost:3000/api/performance/stats

# Generate performance report
curl http://localhost:3000/api/intelligence/report
```

## Environment Variables

### Performance-Related Settings

```env
# Caching
DISABLE_CACHING=false
CACHE_MAX_SIZE=5000
CACHE_TTL=3600000
CACHE_MAX_MEMORY_MB=100

# Batching
ENABLE_BATCHING=true
BATCH_MAX_SIZE=10
BATCH_MAX_WAIT=100
BATCH_CONCURRENCY=3

# Connection Pooling
ENABLE_CONNECTION_POOLING=true
POOL_MIN_CONNECTIONS=2
POOL_MAX_CONNECTIONS=10
POOL_ACQUIRE_TIMEOUT=30000
POOL_IDLE_TIMEOUT=30000

# Prompt Optimization
ENABLE_PROMPT_OPTIMIZATION=true
PROMPT_COMPRESSION_LEVEL=moderate
PROMPT_MAX_TOKENS=4096

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
MONITOR_INTERVAL=10000
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85

# Resource Limits
MAX_CONCURRENT_REQUESTS=50
MAX_REQUEST_SIZE_MB=10
REQUEST_TIMEOUT=300000
```

## Troubleshooting Performance Issues

### High Latency

1. **Check model size**
   ```bash
   curl http://localhost:3000/api/models
   ```

2. **Review cache stats**
   ```bash
   curl http://localhost:3000/api/performance/stats | jq '.cache'
   ```

3. **Analyze prompt size**
   - Enable prompt optimization
   - Reduce context window
   - Use smaller models

### High Memory Usage

1. **Unload unused models**
   ```bash
   curl -X POST http://localhost:3000/api/models/ollama/llama3.1:70b/unload
   ```

2. **Clear caches**
   ```bash
   curl -X POST http://localhost:3000/api/maintenance
   ```

3. **Reduce pool sizes**
   ```env
   POOL_MAX_CONNECTIONS=5
   ```

### Low Throughput

1. **Enable batching**
   ```env
   ENABLE_BATCHING=true
   ```

2. **Increase connection pools**
   ```env
   POOL_MAX_CONNECTIONS=20
   ```

3. **Use multiple workers**
   ```bash
   NODE_CLUSTER_WORKERS=4 npm start
   ```

## Best Practices

### 1. Model Management
- Keep only necessary models loaded
- Use quantized models for better memory efficiency
- Configure auto-unloading for idle models

### 2. Caching Strategy
- Cache expensive operations (embeddings, complex prompts)
- Set appropriate TTLs based on data volatility
- Monitor cache hit rates (target > 30%)

### 3. Request Optimization
- Batch similar requests when possible
- Use streaming for long responses
- Implement client-side request deduplication

### 4. Monitoring
- Set up alerts for performance degradation
- Track trends over time
- Regularly review performance reports

### 5. Scaling
- Horizontal scaling with load balancer
- GPU sharing across instances
- Distributed caching with Redis

## Performance Benchmarks

### Hardware: M1 Max 32GB

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Cache hit | <1ms | 10,000 req/s |
| Llama 3.1 8B (100 tokens) | 200ms | 50 req/s |
| Llama 3.1 70B (100 tokens) | 2s | 5 req/s |
| Batch processing (10 items) | 300ms | 33 req/s |
| With compression | +5ms | -2% |

### Optimization Impact

| Feature | Latency Reduction | Throughput Increase |
|---------|------------------|---------------------|
| Caching | 99%+ | 100x+ |
| Batching | 60% | 3x |
| Connection pooling | 20% | 1.5x |
| Prompt optimization | 15% | 1.2x |
| Compression | -2% | 1.1x |

## Conclusion

Performance optimization is an ongoing process. Start with the basics (caching, pooling), measure impact, and progressively add more optimizations based on your specific workload and requirements.