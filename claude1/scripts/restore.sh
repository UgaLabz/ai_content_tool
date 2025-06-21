#!/bin/bash
# AI Content Platform Restore Script

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-ai-content}"
BACKUP_FILE="${1:-}"
S3_BUCKET="${S3_BUCKET:-ai-content-backups}"
RESTORE_DIR="/tmp/ai-content-restore"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Usage
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file|latest>"
    echo "Examples:"
    echo "  $0 /path/to/ai-content-backup-20240101_120000.tar.gz"
    echo "  $0 latest  # Download and restore latest backup from S3"
    exit 1
fi

# Create restore directory
rm -rf "$RESTORE_DIR"
mkdir -p "$RESTORE_DIR"

log_info "Starting restore process..."

# Download from S3 if "latest" is specified
if [ "$BACKUP_FILE" = "latest" ]; then
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Cannot download from S3."
    fi
    
    log_info "Downloading latest backup from S3..."
    
    # Get latest backup timestamp
    LATEST_TIMESTAMP=$(aws s3 cp "s3://$S3_BUCKET/backups/latest.txt" - 2>/dev/null || echo "")
    if [ -z "$LATEST_TIMESTAMP" ]; then
        log_error "Could not find latest backup marker in S3"
    fi
    
    BACKUP_FILE="$RESTORE_DIR/ai-content-backup-$LATEST_TIMESTAMP.tar.gz"
    aws s3 cp "s3://$S3_BUCKET/backups/ai-content-backup-$LATEST_TIMESTAMP.tar.gz" "$BACKUP_FILE" || \
        log_error "Failed to download backup from S3"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
fi

# Extract backup
log_info "Extracting backup..."
cd "$RESTORE_DIR"
tar xzf "$BACKUP_FILE"

# Find extracted directory
BACKUP_DIR=$(find . -maxdepth 1 -type d -name "backup_*" | head -1)
if [ -z "$BACKUP_DIR" ]; then
    log_error "Could not find backup directory in archive"
fi

cd "$BACKUP_DIR"

# Read metadata
if [ -f "metadata.json" ]; then
    log_info "Backup metadata:"
    cat metadata.json | jq . || cat metadata.json
else
    log_warn "No metadata found in backup"
fi

# Confirmation prompt
read -p "Are you sure you want to restore this backup? This will overwrite existing data! (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Restore cancelled"
    exit 0
fi

# Function to restore pod data
restore_pod_data() {
    local pod_name=$1
    local target_path=$2
    local backup_name=$3
    
    if [ -f "${backup_name}.tar.gz" ]; then
        log_info "Restoring $backup_name to pod $pod_name..."
        
        # Create target directory if it doesn't exist
        kubectl exec -n "$NAMESPACE" "$pod_name" -- mkdir -p "$target_path" 2>/dev/null || true
        
        # Copy and extract
        cat "${backup_name}.tar.gz" | \
            kubectl exec -i -n "$NAMESPACE" "$pod_name" -- tar xzf - -C / 2>/dev/null || \
            log_error "Failed to restore $backup_name"
        
        log_info "✓ $backup_name restored successfully"
    else
        log_warn "✗ Backup file ${backup_name}.tar.gz not found"
    fi
}

# 1. Scale down deployments
log_info "Scaling down deployments..."
kubectl scale deployment --all --replicas=0 -n "$NAMESPACE" || \
    log_warn "Could not scale down all deployments"

# Wait for pods to terminate
log_info "Waiting for pods to terminate..."
kubectl wait --for=delete pod --all -n "$NAMESPACE" --timeout=60s || true

# 2. Restore Kubernetes configurations
if [ -f "k8s-configmaps.yaml" ]; then
    log_info "Restoring ConfigMaps..."
    kubectl apply -f "k8s-configmaps.yaml" || log_warn "Failed to restore some ConfigMaps"
fi

# 3. Start Ollama first (needed by API)
log_info "Starting Ollama..."
kubectl scale deployment ollama-deployment --replicas=1 -n "$NAMESPACE" || \
    log_warn "Could not start Ollama deployment"

# Wait for Ollama to be ready
kubectl wait --for=condition=ready pod -l app=ai-content-ollama -n "$NAMESPACE" --timeout=300s || \
    log_warn "Ollama did not become ready in time"

OLLAMA_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-ollama -o jsonpath='{.items[0].metadata.name}')

# 4. Restore Ollama models
if [ -n "$OLLAMA_POD" ] && [ -f "ollama-models.tar.gz" ]; then
    restore_pod_data "$OLLAMA_POD" "/home/ollama/.ollama/models" "ollama-models"
    
    # Restart Ollama to recognize restored models
    log_info "Restarting Ollama..."
    kubectl delete pod "$OLLAMA_POD" -n "$NAMESPACE"
    kubectl wait --for=condition=ready pod -l app=ai-content-ollama -n "$NAMESPACE" --timeout=300s
fi

# 5. Start LocalAI (if exists)
kubectl scale deployment localai-deployment --replicas=1 -n "$NAMESPACE" 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=ai-content-localai -n "$NAMESPACE" --timeout=300s 2>/dev/null || true

LOCALAI_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-localai -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

# 6. Restore LocalAI models
if [ -n "$LOCALAI_POD" ] && [ -f "localai-models.tar.gz" ]; then
    restore_pod_data "$LOCALAI_POD" "/models" "localai-models"
fi

# 7. Start Redis (if exists)
kubectl scale deployment redis-deployment --replicas=1 -n "$NAMESPACE" 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=ai-content-redis -n "$NAMESPACE" --timeout=60s 2>/dev/null || true

REDIS_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

# 8. Restore Redis data
if [ -n "$REDIS_POD" ] && [ -f "redis-dump.rdb" ]; then
    log_info "Restoring Redis data..."
    kubectl cp "redis-dump.rdb" "$NAMESPACE/$REDIS_POD:/data/dump.rdb" || \
        log_warn "Could not restore Redis data"
    
    # Restart Redis to load the dump
    kubectl delete pod "$REDIS_POD" -n "$NAMESPACE"
    kubectl wait --for=condition=ready pod -l app=ai-content-redis -n "$NAMESPACE" --timeout=60s
fi

# 9. Start API pods
log_info "Starting API pods..."
kubectl scale deployment api-deployment --replicas=3 -n "$NAMESPACE" || \
    log_warn "Could not start API deployment"

kubectl wait --for=condition=ready pod -l app=ai-content-api -n "$NAMESPACE" --timeout=300s || \
    log_warn "API pods did not become ready in time"

API_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-api -o jsonpath='{.items[0].metadata.name}')

# 10. Restore API data
if [ -n "$API_POD" ] && [ -f "api-data.tar.gz" ]; then
    restore_pod_data "$API_POD" "/app/data" "api-data"
fi

# 11. Start remaining services
log_info "Starting remaining services..."
kubectl scale deployment nginx-deployment --replicas=1 -n "$NAMESPACE" 2>/dev/null || true

# 12. Verify restore
log_info "Verifying restore..."
sleep 10

# Check pod status
kubectl get pods -n "$NAMESPACE"

# Test API health
API_SERVICE=$(kubectl get svc api-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
if [ -n "$API_SERVICE" ]; then
    kubectl run -i --rm test-api --image=curlimages/curl --restart=Never -- \
        curl -f "http://$API_SERVICE:3000/health" || \
        log_warn "API health check failed"
fi

# Cleanup
rm -rf "$RESTORE_DIR"

log_info "Restore completed!"
log_info "Please verify that all services are functioning correctly."