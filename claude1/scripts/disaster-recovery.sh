#!/bin/bash
# AI Content Platform Disaster Recovery Script

set -euo pipefail

# Configuration
PRIMARY_CLUSTER="${PRIMARY_CLUSTER:-primary}"
DR_CLUSTER="${DR_CLUSTER:-dr}"
S3_BUCKET="${S3_BUCKET:-ai-content-backups}"
NAMESPACE="${NAMESPACE:-ai-content}"
MODE="${1:-status}"  # status, failover, failback

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_header() {
    echo -e "\n${BLUE}==== $1 ====${NC}"
}

# Check cluster connectivity
check_cluster() {
    local cluster=$1
    kubectl --context="$cluster" cluster-info &>/dev/null
}

# Get cluster status
get_cluster_status() {
    local cluster=$1
    log_header "Cluster: $cluster"
    
    if check_cluster "$cluster"; then
        echo "Status: ONLINE"
        
        # Get pod status
        echo -e "\nPods:"
        kubectl --context="$cluster" get pods -n "$NAMESPACE" --no-headers | \
            awk '{print "  " $1 " - " $3}'
        
        # Get ingress
        echo -e "\nIngress:"
        kubectl --context="$cluster" get ingress -n "$NAMESPACE" --no-headers | \
            awk '{print "  " $1 " - " $3}'
    else
        echo "Status: OFFLINE"
    fi
}

# Perform health check
health_check() {
    local cluster=$1
    local endpoint=$2
    
    if curl -sf "$endpoint/health" -m 5 &>/dev/null; then
        echo "Health: OK"
    else
        echo "Health: FAILED"
    fi
}

# Status command
status() {
    log_header "Disaster Recovery Status"
    
    # Check primary cluster
    get_cluster_status "$PRIMARY_CLUSTER"
    
    # Check DR cluster
    get_cluster_status "$DR_CLUSTER"
    
    # Check backup status
    log_header "Backup Status"
    if command -v aws &> /dev/null; then
        LATEST=$(aws s3 cp "s3://$S3_BUCKET/backups/latest.txt" - 2>/dev/null || echo "N/A")
        echo "Latest backup: $LATEST"
        
        # List recent backups
        echo -e "\nRecent backups:"
        aws s3 ls "s3://$S3_BUCKET/backups/" | \
            grep "ai-content-backup-" | \
            tail -5 | \
            awk '{print "  " $4 " (" $3 " bytes)"}'
    else
        echo "AWS CLI not available"
    fi
}

# Failover to DR cluster
failover() {
    log_header "Starting Failover to DR Cluster"
    
    # 1. Verify DR cluster is available
    if ! check_cluster "$DR_CLUSTER"; then
        log_error "DR cluster is not accessible!"
        exit 1
    fi
    
    # 2. Check if primary is down
    if check_cluster "$PRIMARY_CLUSTER"; then
        log_warn "Primary cluster is still online!"
        read -p "Continue with failover anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Failover cancelled"
            exit 0
        fi
    fi
    
    # 3. Create namespace in DR if needed
    log_info "Ensuring namespace exists in DR cluster..."
    kubectl --context="$DR_CLUSTER" create namespace "$NAMESPACE" 2>/dev/null || true
    
    # 4. Restore latest backup to DR
    log_info "Restoring latest backup to DR cluster..."
    export KUBECONFIG_SAVED="$KUBECONFIG"
    kubectl config use-context "$DR_CLUSTER"
    
    # Download and run restore script
    bash "$(dirname "$0")/restore.sh" latest
    
    # 5. Update DNS/Load Balancer
    log_info "Updating DNS entries..."
    # This would typically update Route53 or your DNS provider
    # Example: aws route53 change-resource-record-sets ...
    
    # 6. Verify DR is serving traffic
    log_info "Verifying DR cluster..."
    sleep 30
    DR_INGRESS=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    
    if [ -n "$DR_INGRESS" ]; then
        health_check "$DR_CLUSTER" "https://$DR_INGRESS"
    fi
    
    log_info "Failover completed!"
    log_warn "Remember to update external DNS entries to point to DR cluster"
    
    export KUBECONFIG="$KUBECONFIG_SAVED"
}

# Failback to primary cluster
failback() {
    log_header "Starting Failback to Primary Cluster"
    
    # 1. Verify primary cluster is available
    if ! check_cluster "$PRIMARY_CLUSTER"; then
        log_error "Primary cluster is not accessible!"
        exit 1
    fi
    
    # 2. Backup current DR state
    log_info "Backing up current DR state..."
    export KUBECONFIG_SAVED="$KUBECONFIG"
    kubectl config use-context "$DR_CLUSTER"
    
    DR_BACKUP=$(bash "$(dirname "$0")/backup.sh")
    log_info "DR backup created: $DR_BACKUP"
    
    # 3. Restore to primary
    log_info "Restoring to primary cluster..."
    kubectl config use-context "$PRIMARY_CLUSTER"
    
    bash "$(dirname "$0")/restore.sh" "$DR_BACKUP"
    
    # 4. Sync any data changes
    log_info "Syncing data changes..."
    # This would sync any data that changed during DR operation
    
    # 5. Update DNS back to primary
    log_info "Updating DNS entries back to primary..."
    # aws route53 change-resource-record-sets ...
    
    # 6. Verify primary is serving traffic
    log_info "Verifying primary cluster..."
    sleep 30
    PRIMARY_INGRESS=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    
    if [ -n "$PRIMARY_INGRESS" ]; then
        health_check "$PRIMARY_CLUSTER" "https://$PRIMARY_INGRESS"
    fi
    
    # 7. Scale down DR (optional)
    read -p "Scale down DR cluster? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        kubectl config use-context "$DR_CLUSTER"
        kubectl scale deployment --all --replicas=0 -n "$NAMESPACE"
        log_info "DR cluster scaled down"
    fi
    
    log_info "Failback completed!"
    
    export KUBECONFIG="$KUBECONFIG_SAVED"
}

# Test DR procedure
test_dr() {
    log_header "Testing Disaster Recovery Procedure"
    
    # 1. Create test namespace
    TEST_NS="${NAMESPACE}-dr-test"
    log_info "Creating test namespace: $TEST_NS"
    
    kubectl --context="$DR_CLUSTER" create namespace "$TEST_NS" 2>/dev/null || true
    
    # 2. Deploy minimal test
    log_info "Deploying test workload..."
    kubectl --context="$DR_CLUSTER" apply -n "$TEST_NS" -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dr-test
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dr-test
  template:
    metadata:
      labels:
        app: dr-test
    spec:
      containers:
      - name: test
        image: nginx:alpine
        ports:
        - containerPort: 80
EOF
    
    # 3. Wait for deployment
    kubectl --context="$DR_CLUSTER" wait --for=condition=available \
        deployment/dr-test -n "$TEST_NS" --timeout=60s
    
    # 4. Test backup/restore
    log_info "Testing backup/restore process..."
    
    # 5. Cleanup
    log_info "Cleaning up test namespace..."
    kubectl --context="$DR_CLUSTER" delete namespace "$TEST_NS"
    
    log_info "DR test completed successfully!"
}

# Create DR runbook
create_runbook() {
    cat > "dr-runbook.md" <<'EOF'
# Disaster Recovery Runbook

## Overview
This runbook provides step-by-step instructions for disaster recovery procedures.

## Contact Information
- On-call Engineer: [PHONE]
- Escalation: [MANAGER PHONE]
- Slack Channel: #incidents

## Pre-requisites
- Access to both primary and DR Kubernetes clusters
- AWS CLI configured with appropriate credentials
- kubectl configured with both cluster contexts

## Procedures

### 1. Confirm Primary Failure
```bash
# Check primary cluster
./disaster-recovery.sh status

# Test primary endpoint
curl -f https://api.ai-content.example.com/health
```

### 2. Initiate Failover
```bash
# Start failover process
./disaster-recovery.sh failover

# Monitor progress
watch kubectl get pods -n ai-content
```

### 3. Update DNS
- Log into DNS provider (Route53/Cloudflare)
- Update A/CNAME records to point to DR load balancer
- Verify DNS propagation

### 4. Validate Services
```bash
# Check all services
kubectl get all -n ai-content

# Test API endpoints
curl https://dr.ai-content.example.com/health
curl https://dr.ai-content.example.com/api/models
```

### 5. Notify Stakeholders
- Update status page
- Send notification to stakeholders
- Update incident ticket

## Failback Procedure

### 1. Verify Primary Recovery
```bash
# Check primary cluster
kubectl --context=primary get nodes
kubectl --context=primary get pods -n ai-content
```

### 2. Initiate Failback
```bash
# Start failback process
./disaster-recovery.sh failback

# Monitor progress
watch kubectl get pods -n ai-content
```

### 3. Update DNS Back
- Revert DNS changes
- Monitor traffic shift

### 4. Post-Incident
- Document incident timeline
- Update runbook with lessons learned
- Schedule post-mortem

## Emergency Contacts
- AWS Support: 1-800-xxx-xxxx
- Kubernetes Support: [VENDOR CONTACT]
- Network Team: [CONTACT]
EOF

    log_info "DR runbook created: dr-runbook.md"
}

# Main logic
case "$MODE" in
    status)
        status
        ;;
    failover)
        failover
        ;;
    failback)
        failback
        ;;
    test)
        test_dr
        ;;
    runbook)
        create_runbook
        ;;
    *)
        echo "Usage: $0 {status|failover|failback|test|runbook}"
        echo ""
        echo "Commands:"
        echo "  status    - Show status of primary and DR clusters"
        echo "  failover  - Failover to DR cluster"
        echo "  failback  - Failback to primary cluster"
        echo "  test      - Test DR procedures"
        echo "  runbook   - Create DR runbook"
        exit 1
        ;;
esac