# Operations Guide

## Overview

This guide covers day-to-day operations, monitoring, troubleshooting, and maintenance procedures for the AI Content Platform.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring](#monitoring)
3. [Troubleshooting](#troubleshooting)
4. [Maintenance](#maintenance)
5. [Incident Response](#incident-response)
6. [Capacity Planning](#capacity-planning)
7. [Security Operations](#security-operations)

## Daily Operations

### Morning Checklist

1. **Check System Health**
```bash
# Overall cluster health
kubectl get nodes
kubectl get pods -n ai-content --field-selector=status.phase!=Running

# Check recent errors
kubectl logs -n ai-content -l app=ai-content-api --since=1h | grep ERROR

# Verify endpoints
curl -s https://api.ai-content.example.com/health | jq .
```

2. **Review Metrics**
- Open Grafana dashboard
- Check error rates (should be < 1%)
- Review latency metrics (p95 < 1s)
- Verify cache hit rates (> 30%)

3. **Check Backup Status**
```bash
# Verify last night's backup
aws s3 ls s3://ai-content-backups/backups/ | tail -5

# Check backup logs
kubectl logs -n ai-content cronjob/backup-job
```

### API Operations

#### Viewing Logs
```bash
# Tail API logs
kubectl logs -n ai-content -l app=ai-content-api -f

# Search for specific errors
kubectl logs -n ai-content -l app=ai-content-api --since=1h | grep -i error

# Export logs for analysis
kubectl logs -n ai-content -l app=ai-content-api --since=24h > api-logs.txt
```

#### Performance Metrics
```bash
# Get current performance stats
curl -s https://api.ai-content.example.com/api/performance/stats | jq .

# Check model-specific metrics
curl -s https://api.ai-content.example.com/api/performance/stats | jq '.models'
```

### Model Management

#### List Available Models
```bash
# Get Ollama models
OLLAMA_POD=$(kubectl get pod -n ai-content -l app=ai-content-ollama -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n ai-content $OLLAMA_POD -- ollama list

# Check model usage via API
curl -s https://api.ai-content.example.com/api/models | jq .
```

#### Add New Model
```bash
# Pull new model
kubectl exec -n ai-content $OLLAMA_POD -- ollama pull mixtral:8x7b

# Verify model loaded
kubectl exec -n ai-content $OLLAMA_POD -- ollama list
```

#### Remove Model
```bash
# Remove unused model
kubectl exec -n ai-content $OLLAMA_POD -- ollama rm llama2:7b

# Verify removal
kubectl exec -n ai-content $OLLAMA_POD -- ollama list
```

## Monitoring

### Key Metrics

1. **System Metrics**
   - CPU Usage: < 80% sustained
   - Memory Usage: < 85%
   - Disk Usage: < 80%
   - Network I/O: Monitor for anomalies

2. **Application Metrics**
   - Request Rate: Track trends
   - Error Rate: < 1%
   - Latency: p50 < 200ms, p95 < 1s, p99 < 5s
   - Cache Hit Rate: > 30%

3. **Model Metrics**
   - Tokens/second: Track by model
   - GPU Utilization: 60-80% optimal
   - Model Load Time: < 30s
   - Generation Latency: Monitor by model size

### Alert Response

#### High CPU Alert
```bash
# Identify high CPU pods
kubectl top pods -n ai-content --sort-by=cpu

# Check for runaway processes
kubectl exec -it -n ai-content <pod-name> -- top

# Scale horizontally if needed
kubectl scale deployment api-deployment --replicas=5 -n ai-content
```

#### High Memory Alert
```bash
# Check memory usage
kubectl top pods -n ai-content --sort-by=memory

# Look for memory leaks
kubectl logs -n ai-content <pod-name> | grep -i "memory"

# Restart pod if necessary
kubectl delete pod <pod-name> -n ai-content
```

#### High Error Rate
```bash
# Check error logs
kubectl logs -n ai-content -l app=ai-content-api --tail=100 | grep ERROR

# Check specific error types
curl -s https://api.ai-content.example.com/api/performance/stats | jq '.requests.errorsByType'

# Review recent deployments
kubectl rollout history deployment/api-deployment -n ai-content
```

## Troubleshooting

### Common Issues

#### 1. API Not Responding
```bash
# Check pod status
kubectl get pods -n ai-content -l app=ai-content-api

# Check recent events
kubectl get events -n ai-content --sort-by='.lastTimestamp' | tail -20

# Check resource limits
kubectl describe pod <api-pod> -n ai-content | grep -A 5 "Limits:"

# Force restart if needed
kubectl rollout restart deployment/api-deployment -n ai-content
```

#### 2. Model Generation Slow
```bash
# Check GPU status
kubectl exec -n ai-content $OLLAMA_POD -- nvidia-smi

# Check model memory usage
kubectl exec -n ai-content $OLLAMA_POD -- nvidia-smi --query-gpu=memory.used --format=csv

# Verify correct model loaded
kubectl exec -n ai-content $OLLAMA_POD -- ollama list

# Check for competing workloads
kubectl top pods -n ai-content
```

#### 3. Cache Not Working
```bash
# Check cache stats
curl -s https://api.ai-content.example.com/api/performance/stats | jq '.cache'

# Verify Redis connectivity
kubectl exec -n ai-content <api-pod> -- nc -zv redis-service 6379

# Check Redis memory
kubectl exec -n ai-content redis-0 -- redis-cli info memory

# Flush cache if needed
kubectl exec -n ai-content redis-0 -- redis-cli FLUSHALL
```

#### 4. Out of Memory Errors
```bash
# Check memory limits
kubectl get pods -n ai-content -o json | jq '.items[].spec.containers[].resources'

# Identify memory-hungry processes
kubectl top pods -n ai-content --sort-by=memory

# Increase memory limits
kubectl patch deployment api-deployment -n ai-content --patch '
spec:
  template:
    spec:
      containers:
      - name: api
        resources:
          limits:
            memory: "2Gi"'
```

### Debug Commands

```bash
# Get into a pod for debugging
kubectl exec -it -n ai-content <pod-name> -- /bin/sh

# Run diagnostic commands
curl -v http://localhost:3000/health
ps aux | grep node
netstat -tlnp

# Check environment variables
env | grep -E "(OLLAMA|LOCALAI|REDIS)"

# Test internal connectivity
nc -zv ollama-service 11434
nc -zv localai-service 8080
nc -zv redis-service 6379
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Review error logs
- Check backup completion
- Monitor resource usage
- Review security alerts

#### Weekly
- Clean up old logs
- Review and optimize slow queries
- Update model usage statistics
- Performance report review

#### Monthly
- Security patches
- Kubernetes updates
- Capacity review
- Cost optimization review
- DR drill

### Maintenance Procedures

#### 1. Clear Old Logs
```bash
# Clear pod logs older than 7 days
kubectl logs -n ai-content -l app=ai-content-api --since=168h > /dev/null

# Clean up log files in pods
kubectl exec -n ai-content <pod> -- find /app/logs -mtime +7 -delete

# Compress and archive important logs
kubectl cp ai-content/<pod>:/app/logs/app.log ./app-$(date +%Y%m%d).log
gzip app-*.log
aws s3 cp app-*.log.gz s3://ai-content-logs/archive/
```

#### 2. Database Maintenance
```bash
# Redis maintenance
kubectl exec -n ai-content redis-0 -- redis-cli BGREWRITEAOF
kubectl exec -n ai-content redis-0 -- redis-cli INFO persistence

# Check for fragmentation
kubectl exec -n ai-content redis-0 -- redis-cli INFO memory | grep fragmentation
```

#### 3. Model Cleanup
```bash
# List all models with sizes
kubectl exec -n ai-content $OLLAMA_POD -- ollama list

# Remove unused models
kubectl exec -n ai-content $OLLAMA_POD -- ollama rm <unused-model>

# Garbage collection
kubectl exec -n ai-content $OLLAMA_POD -- ollama gc
```

### Upgrade Procedures

#### Application Update
```bash
# 1. Build and push new image
docker build -t ai-content/api:v2.0.0 -f docker/Dockerfile.api .
docker push ai-content/api:v2.0.0

# 2. Update deployment
kubectl set image deployment/api-deployment api=ai-content/api:v2.0.0 -n ai-content

# 3. Monitor rollout
kubectl rollout status deployment/api-deployment -n ai-content

# 4. Verify new version
kubectl logs -n ai-content -l app=ai-content-api | grep "Starting server"
```

#### Kubernetes Upgrade
```bash
# 1. Check current version
kubectl version

# 2. Backup everything
./scripts/backup.sh

# 3. Cordon nodes
kubectl cordon <node-name>

# 4. Drain node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 5. Upgrade node
# (Follow cloud provider instructions)

# 6. Uncordon node
kubectl uncordon <node-name>
```

## Incident Response

### Incident Levels

- **P1 (Critical)**: Complete service outage
- **P2 (Major)**: Significant degradation, >50% errors
- **P3 (Minor)**: Partial degradation, <50% errors
- **P4 (Low)**: Non-critical issues

### Response Procedures

#### 1. Initial Response
```bash
# Quick health check
curl -f https://api.ai-content.example.com/health || echo "API DOWN"

# Check all pods
kubectl get pods -n ai-content

# Recent events
kubectl get events -n ai-content --sort-by='.lastTimestamp' | head -20

# Error summary
kubectl logs -n ai-content -l app=ai-content-api --since=10m | grep -c ERROR
```

#### 2. Mitigation
```bash
# Quick restart (if needed)
kubectl rollout restart deployment/api-deployment -n ai-content

# Scale up for load
kubectl scale deployment api-deployment --replicas=10 -n ai-content

# Enable circuit breaker
kubectl set env deployment/api-deployment CIRCUIT_BREAKER_ENABLED=true -n ai-content

# Rollback if recent deployment
kubectl rollout undo deployment/api-deployment -n ai-content
```

#### 3. Communication
- Update status page
- Notify stakeholders via Slack/email
- Create incident ticket
- Start incident bridge if P1/P2

#### 4. Resolution & Post-Mortem
- Document timeline
- Identify root cause
- Create action items
- Update runbooks
- Share learnings

## Capacity Planning

### Metrics to Track

1. **Request Growth**
```bash
# Weekly request volume
curl -s https://api.ai-content.example.com/api/metrics/weekly | jq .

# Peak usage times
curl -s https://api.ai-content.example.com/api/metrics/hourly | jq .
```

2. **Resource Utilization**
```bash
# Average CPU/Memory over time
kubectl top nodes
kubectl top pods -n ai-content

# Storage growth
kubectl exec -n ai-content $OLLAMA_POD -- df -h /home/ollama/.ollama/models
```

3. **Model Usage**
```bash
# Model request distribution
curl -s https://api.ai-content.example.com/api/performance/stats | \
  jq '.models | to_entries | sort_by(.value.requests) | reverse'
```

### Scaling Decisions

#### When to Scale Horizontally
- CPU consistently > 70%
- Request queuing occurring
- Latency increasing with load

#### When to Scale Vertically
- Memory usage > 80%
- Model loading failures
- GPU memory exhausted

#### When to Add GPU Nodes
- GPU utilization > 80%
- Model loading times increasing
- Queue depth for GPU tasks growing

## Security Operations

### Daily Security Tasks

1. **Review Access Logs**
```bash
# Check for suspicious access patterns
kubectl logs -n ai-content nginx-0 | grep -E "404|403|401" | tail -50

# Look for scanning attempts
kubectl logs -n ai-content nginx-0 | grep -i "scanner\|bot\|crawl"
```

2. **Check Authentication**
```bash
# Failed auth attempts
kubectl logs -n ai-content -l app=ai-content-api | grep -i "auth.*fail"

# API key usage
curl -s https://api.ai-content.example.com/api/admin/keys/usage | jq .
```

3. **Security Alerts**
```bash
# Check security events
kubectl get events -n ai-content | grep -i security

# Review network policies
kubectl get networkpolicies -n ai-content
```

### Security Procedures

#### Rotate Secrets
```bash
# Generate new secret
openssl rand -base64 32

# Update secret
kubectl create secret generic ai-content-secrets \
  --from-literal=jwt-secret=<new-secret> \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secret
kubectl rollout restart deployment/api-deployment -n ai-content
```

#### Security Scan
```bash
# Scan images for vulnerabilities
trivy image ai-content/api:latest

# Scan running containers
kubectl get pods -n ai-content -o jsonpath="{.items[*].spec.containers[*].image}" | \
  tr -s '[[:space:]]' '\n' | sort | uniq | xargs -I {} trivy image {}

# Check RBAC
kubectl auth can-i --list --namespace=ai-content
```

## Appendix

### Useful Aliases

Add to ~/.bashrc:
```bash
alias k='kubectl'
alias kn='kubectl -n ai-content'
alias klog='kubectl logs -n ai-content'
alias kpods='kubectl get pods -n ai-content'
alias ktop='kubectl top pods -n ai-content'
```

### Emergency Contacts

- On-Call Engineer: [ROTATION]
- Platform Team Lead: [CONTACT]
- Security Team: [CONTACT]
- Cloud Provider Support: [CONTACT]