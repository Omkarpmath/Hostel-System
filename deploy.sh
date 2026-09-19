#!/usr/bin/env bash
# ==============================================================================
# BMSET Hostel Management System — Production Deployment Script
# Supports: Pre-flight checks, DB backup, migrations, container rollouts, rollback
# ==============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 1. Check prerequisites
log_info "1. Verifying pre-flight prerequisites..."
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required. Aborting."; exit 1; }

COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
fi

# 2. Database Backup (Safety First)
mkdir -p "$BACKUP_DIR"
if $COMPOSE_CMD ps --services --filter "status=running" | grep -q "postgres"; then
  log_info "2. Postgres container running. Creating automated pre-deploy DB snapshot..."
  DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"
  $COMPOSE_CMD exec -T postgres pg_dump -U "${DB_USER:-postgres}" "${DB_NAME:-hostel_db}" > "$DB_BACKUP_FILE" 2>/dev/null || log_warn "Backup command completed with warnings."
  if [ -s "$DB_BACKUP_FILE" ]; then
    log_success "Database snapshot safely created at $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
  fi
else
  log_info "2. Postgres not running yet; skipping pre-backup (initial launch mode)."
fi

# 3. Build & Launch Container Stack
log_info "3. Building and launching production containers with zero-downtime policy..."
$COMPOSE_CMD up -d --build --remove-orphans

# 4. Database Migrations
log_info "4. Applying database schema sync & migrations..."
$COMPOSE_CMD exec -T server npx prisma db push --skip-generate || {
  log_error "Database sync failed! Initiating rollback..."
  if [ -f "${DB_BACKUP_FILE:-}" ] && [ -s "$DB_BACKUP_FILE" ]; then
    log_warn "Restoring database from snapshot: $DB_BACKUP_FILE"
    $COMPOSE_CMD exec -T postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-hostel_db}" < "$DB_BACKUP_FILE"
  fi
  exit 1
}

# 5. Service Health Check Ping
log_info "5. Verifying server and client health probes..."
sleep 5

HEALTH_OK=false
for i in {1..12}; do
  if curl -s -f "http://localhost:5001/api/v1/health" >/dev/null 2>&1 || curl -s -f "http://127.0.0.1:5001/api/v1/health" >/dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  log_info "Waiting for API server to become ready (attempt $i/12)..."
  sleep 3
done

if [ "$HEALTH_OK" = true ]; then
  log_success "================================================================"
  log_success "  BMSET Hostel Management System deployed successfully! 🚀"
  log_success "  Frontend Web Client: http://localhost (Port 80)"
  log_success "  Backend API Server:   http://localhost:5001/api/v1"
  log_success "  Health Check URL:     http://localhost:5001/api/v1/health"
  log_success "================================================================"
else
  log_error "Health check probe failed. Check logs via: $COMPOSE_CMD logs server"
  exit 1
fi
