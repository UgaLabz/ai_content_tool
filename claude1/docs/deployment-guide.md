# Production Deployment Guide

## Overview

This guide covers deploying the AI Content Platform to production using Kubernetes.

## Prerequisites

- Kubernetes cluster (1.25+) with GPU nodes
- kubectl configured
- Helm 3.x installed
- Docker registry access
- SSL certificates
- Domain name configured

## Architecture

```
                    ┌─────────────────┐
                    │   Ingress/LB    │
                    │  (HTTPS/HTTP)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx Proxy   │
                    │  (Rate Limit)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐  ┌───────▼──────┐
│   API Pods   │    │   Ollama Pod    │  │ LocalAI Pod  │
│   (3 replicas)│    │   (GPU node)    │  │  (GPU node)  │
└───────┬──────┘    └─────────────────┘  └──────────────┘
        │
┌───────▼──────┐
│  Redis Cache │
│   (Optional) │
└──────────────┘
```

## Deployment Steps

### 1. Prepare Environment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (edit first!)
cp k8s/secrets.yaml k8s/secrets.prod.yaml
# Edit k8s/secrets.prod.yaml with production values
kubectl apply -f k8s/secrets.prod.yaml
```

### 2. Configure Storage

```bash
# Create storage classes if needed
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
EOF
```

### 3. Deploy Core Services

```bash
# Deploy ConfigMaps
kubectl apply -f k8s/configmap.yaml

# Deploy Redis (if using)
kubectl apply -f k8s/redis-deployment.yaml

# Deploy Ollama
kubectl apply -f k8s/ollama-deployment.yaml

# Wait for Ollama to be ready
kubectl wait --for=condition=ready pod -l app=ai-content-ollama -n ai-content --timeout=300s

# Deploy API
kubectl apply -f k8s/api-deployment.yaml

# Deploy Nginx
kubectl apply -f k8s/nginx-deployment.yaml
```

### 4. Configure Networking

```bash
# Apply network policies
kubectl apply -f k8s/network-policy.yaml

# Apply RBAC
kubectl apply -f k8s/rbac.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Install Models

```bash
# Get Ollama pod name
OLLAMA_POD=$(kubectl get pod -l app=ai-content-ollama -n ai-content -o jsonpath='{.items[0].metadata.name}')

# Pull models
kubectl exec -n ai-content $OLLAMA_POD -- ollama pull llama3.1:8b
kubectl exec -n ai-content $OLLAMA_POD -- ollama pull llama3.1:70b
kubectl exec -n ai-content $OLLAMA_POD -- ollama pull mixtral:8x7b
```

### 6. Setup Monitoring

```bash
# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace ai-content \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=changeme

# Apply custom configs
kubectl apply -f k8s/monitoring/
```

### 7. Configure Autoscaling

```bash
# API autoscaling
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: ai-content
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
```

## Configuration

### Environment Variables

Key environment variables for production:

```env
# API Configuration
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3000

# Security
JWT_SECRET=<strong-random-string>
ENCRYPTION_KEY=<32-byte-key>
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://your-domain.com

# Performance
ENABLE_CACHING=true
ENABLE_PROMPT_OPTIMIZATION=true
CACHE_TTL=3600000
POOL_MAX_CONNECTIONS=20

# Models
OLLAMA_DEFAULT_MODEL=llama3.1:8b
OLLAMA_KEEP_ALIVE=5m
OLLAMA_NUM_PARALLEL=2
```

### Resource Requirements

#### Minimum Production Setup
- **API Pods**: 3x (1 CPU, 1GB RAM each)
- **Ollama**: 1x (4 CPU, 32GB RAM, 1 GPU)
- **LocalAI**: 1x (4 CPU, 16GB RAM, 1 GPU)
- **Redis**: 1x (1 CPU, 2GB RAM)
- **Storage**: 200GB SSD for models

#### Recommended Production Setup
- **API Pods**: 5x (2 CPU, 2GB RAM each)
- **Ollama**: 2x (8 CPU, 64GB RAM, 1 GPU each)
- **LocalAI**: 2x (4 CPU, 32GB RAM, 1 GPU each)
- **Redis**: 3x (2 CPU, 4GB RAM) in cluster mode
- **Storage**: 500GB SSD for models

## Security Hardening

### 1. Network Security

```bash
# Enable Pod Security Standards
kubectl label namespace ai-content pod-security.kubernetes.io/enforce=restricted

# Configure ingress with WAF
kubectl annotate ingress ai-content-ingress \
  nginx.ingress.kubernetes.io/enable-modsecurity="true" \
  nginx.ingress.kubernetes.io/modsecurity-snippet=|
    SecRuleEngine On
    SecRequestBodyLimit 10485760
```

### 2. Secrets Management

```bash
# Use Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Encrypt secrets
echo -n 'mysecret' | kubectl create secret generic mysecret \
  --dry-run=client --from-file=password=/dev/stdin -o yaml | \
  kubeseal -o yaml > mysealedsecret.yaml
```

### 3. Container Security

- All containers run as non-root
- Read-only root filesystem where possible
- Security contexts enforced
- Resource limits set
- Network policies applied

## Monitoring & Alerts

### Key Metrics to Monitor

1. **API Health**
   - Request rate and latency
   - Error rate
   - Cache hit rate
   - Active connections

2. **Model Performance**
   - Generation latency by model
   - Token throughput
   - Model memory usage
   - GPU utilization

3. **System Resources**
   - CPU and memory usage
   - Disk I/O
   - Network traffic
   - Pod restarts

### Alert Configuration

Critical alerts configured:
- API error rate > 5%
- Response time p95 > 5s
- Memory usage > 85%
- Pod crash looping
- GPU errors

## Backup & Recovery

### Backup Strategy

1. **Model Backups**
```bash
# Backup Ollama models
kubectl exec -n ai-content $OLLAMA_POD -- tar czf - /home/ollama/.ollama/models | \
  aws s3 cp - s3://backup-bucket/ollama-models-$(date +%Y%m%d).tar.gz
```

2. **Character Data**
```bash
# Backup character profiles
kubectl exec -n ai-content $API_POD -- tar czf - /app/data | \
  aws s3 cp - s3://backup-bucket/character-data-$(date +%Y%m%d).tar.gz
```

3. **Database Backups** (if using)
```bash
# Redis backup
kubectl exec -n ai-content redis-0 -- redis-cli BGSAVE
kubectl cp ai-content/redis-0:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Recovery Procedures

1. **Service Recovery**
```bash
# Scale down
kubectl scale deployment api-deployment --replicas=0 -n ai-content

# Restore data
kubectl cp backup.tar.gz ai-content/$POD:/tmp/
kubectl exec -n ai-content $POD -- tar xzf /tmp/backup.tar.gz -C /

# Scale up
kubectl scale deployment api-deployment --replicas=3 -n ai-content
```

2. **Disaster Recovery**
- Full cluster backup using Velero
- Cross-region replication
- Regular DR drills

## Maintenance

### Rolling Updates

```bash
# Update API image
kubectl set image deployment/api-deployment api=ai-content/api:v2.0.0 -n ai-content

# Monitor rollout
kubectl rollout status deployment/api-deployment -n ai-content

# Rollback if needed
kubectl rollout undo deployment/api-deployment -n ai-content
```

### Scaling Operations

```bash
# Manual scaling
kubectl scale deployment api-deployment --replicas=5 -n ai-content

# Update autoscaler
kubectl patch hpa api-hpa -n ai-content --patch '{"spec":{"maxReplicas":15}}'
```

### Model Updates

```bash
# Pull new model version
kubectl exec -n ai-content $OLLAMA_POD -- ollama pull llama3.1:13b

# Remove old model
kubectl exec -n ai-content $OLLAMA_POD -- ollama rm llama3.1:8b
```

## Troubleshooting

### Common Issues

1. **High Latency**
   - Check model size vs available memory
   - Verify GPU is being used
   - Review cache hit rates
   - Check network policies

2. **Pod Crashes**
   - Review resource limits
   - Check logs: `kubectl logs -n ai-content <pod-name>`
   - Verify health checks
   - Check for OOM kills

3. **GPU Issues**
   - Verify GPU drivers: `kubectl exec <pod> -- nvidia-smi`
   - Check GPU allocation
   - Review CUDA compatibility

### Debug Commands

```bash
# Get pod details
kubectl describe pod <pod-name> -n ai-content

# View logs
kubectl logs -n ai-content <pod-name> --tail=100 -f

# Execute commands in pod
kubectl exec -it -n ai-content <pod-name> -- /bin/sh

# Check events
kubectl get events -n ai-content --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward -n ai-content svc/api-service 3000:3000
```

## Performance Tuning

### API Optimization
- Enable response compression
- Configure connection pooling
- Tune cache sizes
- Optimize batch sizes

### Model Optimization
- Use quantized models for better performance
- Configure appropriate context windows
- Adjust parallel request handling
- Implement model warm-up

### Kubernetes Optimization
- Use node affinity for GPU pods
- Configure pod disruption budgets
- Optimize resource requests/limits
- Use local SSD for model storage

## Cost Optimization

1. **Right-size instances**
   - Use spot instances for non-critical workloads
   - Reserve instances for predictable workloads

2. **Optimize GPU usage**
   - Share GPUs when possible
   - Use smaller models for simple tasks
   - Implement request batching

3. **Storage optimization**
   - Use lifecycle policies
   - Compress old logs
   - Clean up unused models

## Compliance & Auditing

1. **Audit logging**
   - All API requests logged
   - Model usage tracked
   - Access patterns monitored

2. **Compliance features**
   - Data encryption at rest and in transit
   - GDPR compliance tools
   - Regular security scans

3. **Access control**
   - RBAC enforced
   - Service accounts limited
   - Network policies restrictive