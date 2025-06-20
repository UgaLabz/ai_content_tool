#!/bin/bash
# AI Content Platform Backup Script

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-ai-content}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/ai-content-backups}"
S3_BUCKET="${S3_BUCKET:-ai-content-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

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
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

log_info "Starting backup process..."

# Function to backup a pod's data
backup_pod_data() {
    local pod_name=$1
    local source_path=$2
    local backup_name=$3
    
    log_info "Backing up $backup_name from pod $pod_name..."
    
    if kubectl exec -n "$NAMESPACE" "$pod_name" -- test -d "$source_path" 2>/dev/null; then
        kubectl exec -n "$NAMESPACE" "$pod_name" -- tar czf - "$source_path" 2>/dev/null | \
            cat > "$BACKUP_PATH/${backup_name}.tar.gz"
        log_info "✓ $backup_name backed up successfully"
    else
        log_warn "✗ $source_path not found in pod $pod_name"
    fi
}

# 1. Backup API data
log_info "Backing up API data..."
API_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=ai-content-api -o jsonpath='{.items[*].metadata.name}')
if [ -n "$API_PODS" ]; then
    # Just backup from the first pod (they should share persistent storage)
    API_POD=$(echo $API_PODS | cut -d' ' -f1)
    backup_pod_data "$API_POD" "/app/data" "api-data"
else
    log_error "No API pods found"
fi

# 2. Backup Ollama models
log_info "Backing up Ollama models..."
OLLAMA_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-ollama -o jsonpath='{.items[0].metadata.name}')
if [ -n "$OLLAMA_POD" ]; then
    # List models first
    kubectl exec -n "$NAMESPACE" "$OLLAMA_POD" -- ollama list > "$BACKUP_PATH/ollama-models.txt" 2>/dev/null || true
    
    # Backup model data
    backup_pod_data "$OLLAMA_POD" "/home/ollama/.ollama/models" "ollama-models"
else
    log_error "No Ollama pod found"
fi

# 3. Backup LocalAI models
log_info "Backing up LocalAI models..."
LOCALAI_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-localai -o jsonpath='{.items[0].metadata.name}')
if [ -n "$LOCALAI_POD" ]; then
    backup_pod_data "$LOCALAI_POD" "/models" "localai-models"
else
    log_warn "No LocalAI pod found"
fi

# 4. Backup Redis data (if exists)
log_info "Backing up Redis data..."
REDIS_POD=$(kubectl get pod -n "$NAMESPACE" -l app=ai-content-redis -o jsonpath='{.items[0].metadata.name}')
if [ -n "$REDIS_POD" ]; then
    # Trigger Redis save
    kubectl exec -n "$NAMESPACE" "$REDIS_POD" -- redis-cli BGSAVE >/dev/null 2>&1
    sleep 2
    
    # Copy dump file
    kubectl cp "$NAMESPACE/$REDIS_POD:/data/dump.rdb" "$BACKUP_PATH/redis-dump.rdb" 2>/dev/null || \
        log_warn "Could not backup Redis data"
else
    log_warn "No Redis pod found"
fi

# 5. Export Kubernetes configurations
log_info "Exporting Kubernetes configurations..."
for resource in configmap secret deployment service ingress; do
    kubectl get "$resource" -n "$NAMESPACE" -o yaml > "$BACKUP_PATH/k8s-${resource}s.yaml" 2>/dev/null || true
done

# 6. Create backup metadata
cat > "$BACKUP_PATH/metadata.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "namespace": "$NAMESPACE",
    "kubernetes_version": "$(kubectl version --short 2>/dev/null | head -1)",
    "backup_version": "1.0",
    "components": {
        "api": $([ -f "$BACKUP_PATH/api-data.tar.gz" ] && echo "true" || echo "false"),
        "ollama": $([ -f "$BACKUP_PATH/ollama-models.tar.gz" ] && echo "true" || echo "false"),
        "localai": $([ -f "$BACKUP_PATH/localai-models.tar.gz" ] && echo "true" || echo "false"),
        "redis": $([ -f "$BACKUP_PATH/redis-dump.rdb" ] && echo "true" || echo "false")
    }
}
EOF

# 7. Create compressed archive
log_info "Creating backup archive..."
cd "$BACKUP_DIR"
tar czf "ai-content-backup-$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"

# 8. Upload to S3 (if configured)
if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
    log_info "Uploading to S3..."
    aws s3 cp "ai-content-backup-$TIMESTAMP.tar.gz" "s3://$S3_BUCKET/backups/" || \
        log_error "Failed to upload to S3"
    
    # Upload latest marker
    echo "$TIMESTAMP" > latest.txt
    aws s3 cp latest.txt "s3://$S3_BUCKET/backups/latest.txt" || true
    rm latest.txt
else
    log_warn "AWS CLI not found or S3_BUCKET not set, skipping S3 upload"
fi

# 9. Cleanup old local backups
log_info "Cleaning up old backups..."
find "$BACKUP_DIR" -name "ai-content-backup-*.tar.gz" -mtime +7 -delete || true
rm -rf "$BACKUP_PATH"

# 10. Cleanup S3 old backups (if configured)
if command -v aws &> /dev/null && [ -n "$S3_BUCKET" ]; then
    log_info "Cleaning up old S3 backups..."
    aws s3 ls "s3://$S3_BUCKET/backups/" | \
        awk '{print $4}' | \
        grep "ai-content-backup-" | \
        sort | \
        head -n -$RETENTION_DAYS | \
        xargs -I {} aws s3 rm "s3://$S3_BUCKET/backups/{}" || true
fi

log_info "Backup completed successfully!"
log_info "Backup saved to: $BACKUP_DIR/ai-content-backup-$TIMESTAMP.tar.gz"

# Return backup filename for use in other scripts
echo "$BACKUP_DIR/ai-content-backup-$TIMESTAMP.tar.gz"