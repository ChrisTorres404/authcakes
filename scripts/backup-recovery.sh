#!/bin/bash

# AuthCakes API - Enterprise Backup & Recovery Script
# Version: 1.0
# Description: Automated backup and recovery procedures for production environments

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/authcakes/backup-recovery.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Environment variables (should be set in production)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-authcakes_production}"
DB_USERNAME="${DB_USERNAME:-authcakes_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-authcakes-backups}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Backup locations
BACKUP_LOCAL_DIR="/var/backups/authcakes"
BACKUP_TEMP_DIR="/tmp/authcakes_backup_${TIMESTAMP}"

# Recovery Point Objective (RPO) and Recovery Time Objective (RTO)
RPO_MINUTES=60  # Maximum data loss acceptable: 1 hour
RTO_MINUTES=240 # Maximum downtime acceptable: 4 hours

# =============================================================================
# Logging Functions
# =============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

check_prerequisites() {
    log "Performing pre-flight checks..."
    
    # Check required tools
    for tool in pg_dump pg_restore aws gpg; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check backup directory
    mkdir -p "$BACKUP_LOCAL_DIR"
    mkdir -p "$BACKUP_TEMP_DIR"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" &> /dev/null; then
        log_error "Cannot connect to database"
        exit 1
    fi
    
    log_success "Pre-flight checks completed"
}

# =============================================================================
# Database Backup Functions
# =============================================================================

backup_database() {
    log "Starting database backup..."
    
    local backup_file="$BACKUP_TEMP_DIR/database_${TIMESTAMP}.sql"
    local compressed_file="$BACKUP_TEMP_DIR/database_${TIMESTAMP}.sql.gz"
    local encrypted_file="$BACKUP_TEMP_DIR/database_${TIMESTAMP}.sql.gz.gpg"
    
    # Create database dump with compression
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$backup_file" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Database dump created: $backup_file"
    else
        log_error "Database dump failed"
        exit 1
    fi
    
    # Compress the backup
    gzip "$backup_file"
    log_success "Backup compressed: $compressed_file"
    
    # Encrypt the backup
    if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        gpg --symmetric \
            --cipher-algo AES256 \
            --compress-algo 2 \
            --compress-level 9 \
            --batch \
            --yes \
            --passphrase "$BACKUP_ENCRYPTION_KEY" \
            --output "$encrypted_file" \
            "$compressed_file"
        
        rm "$compressed_file"
        log_success "Backup encrypted: $encrypted_file"
        echo "$encrypted_file"
    else
        echo "$compressed_file"
    fi
}

backup_application_data() {
    log "Starting application data backup..."
    
    local app_backup_file="$BACKUP_TEMP_DIR/application_${TIMESTAMP}.tar.gz"
    
    # Backup application configuration and logs
    tar -czf "$app_backup_file" \
        -C "$PROJECT_ROOT" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude=".git" \
        --exclude="*.log" \
        . \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Application data backup created: $app_backup_file"
        echo "$app_backup_file"
    else
        log_error "Application data backup failed"
        exit 1
    fi
}

# =============================================================================
# Cloud Storage Functions
# =============================================================================

upload_to_s3() {
    local file_path="$1"
    local s3_key="backups/$(basename "$file_path")"
    
    log "Uploading backup to S3: $s3_key"
    
    aws s3 cp "$file_path" "s3://$BACKUP_S3_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --metadata "timestamp=$TIMESTAMP,type=backup" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to S3: s3://$BACKUP_S3_BUCKET/$s3_key"
    else
        log_error "S3 upload failed for: $file_path"
        exit 1
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_LOCAL_DIR" -name "*.sql.gz*" -mtime +$BACKUP_RETENTION_DAYS -delete
    find "$BACKUP_LOCAL_DIR" -name "*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
    
    # Remove old S3 backups
    aws s3api list-objects-v2 \
        --bucket "$BACKUP_S3_BUCKET" \
        --prefix "backups/" \
        --query "Contents[?LastModified<='$(date -d "$BACKUP_RETENTION_DAYS days ago" --iso-8601)'].Key" \
        --output text | \
    while read -r key; do
        if [ -n "$key" ]; then
            aws s3 rm "s3://$BACKUP_S3_BUCKET/$key"
            log "Removed old backup: s3://$BACKUP_S3_BUCKET/$key"
        fi
    done
    
    log_success "Old backups cleaned up"
}

# =============================================================================
# Recovery Functions
# =============================================================================

list_available_backups() {
    log "Listing available backups..."
    
    echo "Local backups:"
    ls -la "$BACKUP_LOCAL_DIR"/*.sql.gz* 2>/dev/null || echo "No local backups found"
    
    echo -e "\nS3 backups:"
    aws s3 ls "s3://$BACKUP_S3_BUCKET/backups/" --recursive
}

download_backup_from_s3() {
    local backup_name="$1"
    local local_path="$BACKUP_TEMP_DIR/$backup_name"
    
    log "Downloading backup from S3: $backup_name"
    
    aws s3 cp "s3://$BACKUP_S3_BUCKET/backups/$backup_name" "$local_path" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Backup downloaded: $local_path"
        echo "$local_path"
    else
        log_error "Failed to download backup: $backup_name"
        exit 1
    fi
}

decrypt_backup() {
    local encrypted_file="$1"
    local decrypted_file="${encrypted_file%.gpg}"
    
    log "Decrypting backup: $encrypted_file"
    
    gpg --decrypt \
        --batch \
        --yes \
        --passphrase "$BACKUP_ENCRYPTION_KEY" \
        --output "$decrypted_file" \
        "$encrypted_file" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Backup decrypted: $decrypted_file"
        echo "$decrypted_file"
    else
        log_error "Failed to decrypt backup: $encrypted_file"
        exit 1
    fi
}

restore_database() {
    local backup_file="$1"
    local target_db="${2:-$DB_NAME}"
    
    log "WARNING: This will overwrite the database: $target_db"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "Database restore cancelled by user"
        exit 0
    fi
    
    log "Restoring database from: $backup_file"
    
    # Create a backup of current database before restore
    local current_backup="$BACKUP_TEMP_DIR/pre_restore_backup_${TIMESTAMP}.sql"
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$target_db" \
        --format=custom \
        --file="$current_backup" \
        2>> "$LOG_FILE"
    
    log "Current database backed up to: $current_backup"
    
    # Restore from backup
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$target_db" \
        --verbose \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "$backup_file" \
        2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Database restored successfully from: $backup_file"
    else
        log_error "Database restore failed"
        log "Attempting to restore from pre-restore backup..."
        
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USERNAME" \
            -d "$target_db" \
            --clean \
            --if-exists \
            "$current_backup" \
            2>> "$LOG_FILE"
        
        log_error "Database restore failed. Original database restored."
        exit 1
    fi
}

# =============================================================================
# Health Check Functions
# =============================================================================

verify_backup_integrity() {
    local backup_file="$1"
    
    log "Verifying backup integrity: $backup_file"
    
    # Test restore to a temporary database
    local test_db="authcakes_backup_test_${TIMESTAMP}"
    
    # Create test database
    PGPASSWORD="$DB_PASSWORD" createdb \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        "$test_db" \
        2>> "$LOG_FILE"
    
    # Restore to test database
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$test_db" \
        "$backup_file" \
        2>> "$LOG_FILE"
    
    local restore_result=$?
    
    # Cleanup test database
    PGPASSWORD="$DB_PASSWORD" dropdb \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        "$test_db" \
        2>> "$LOG_FILE"
    
    if [ $restore_result -eq 0 ]; then
        log_success "Backup integrity verified: $backup_file"
        return 0
    else
        log_error "Backup integrity check failed: $backup_file"
        return 1
    fi
}

check_rpo_compliance() {
    local latest_backup_time="$1"
    local current_time=$(date +%s)
    local backup_time=$(date -d "$latest_backup_time" +%s)
    local time_diff=$(( (current_time - backup_time) / 60 ))
    
    if [ $time_diff -le $RPO_MINUTES ]; then
        log_success "RPO compliance: OK (Last backup: $time_diff minutes ago)"
        return 0
    else
        log_error "RPO violation: Last backup was $time_diff minutes ago (RPO: $RPO_MINUTES minutes)"
        return 1
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

perform_full_backup() {
    log "Starting full backup procedure..."
    
    check_prerequisites
    
    # Backup database
    local db_backup=$(backup_database)
    
    # Backup application data
    local app_backup=$(backup_application_data)
    
    # Upload to S3
    upload_to_s3 "$db_backup"
    upload_to_s3 "$app_backup"
    
    # Move to local backup directory
    mv "$db_backup" "$BACKUP_LOCAL_DIR/"
    mv "$app_backup" "$BACKUP_LOCAL_DIR/"
    
    # Verify backup integrity
    verify_backup_integrity "$BACKUP_LOCAL_DIR/$(basename "$db_backup")"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Cleanup temp directory
    rm -rf "$BACKUP_TEMP_DIR"
    
    log_success "Full backup completed successfully"
}

perform_recovery() {
    local backup_name="$1"
    
    log "Starting recovery procedure..."
    
    check_prerequisites
    
    # Download backup if it's from S3
    local backup_file
    if [[ "$backup_name" == s3://* ]]; then
        backup_file=$(download_backup_from_s3 "$(basename "$backup_name")")
    else
        backup_file="$BACKUP_LOCAL_DIR/$backup_name"
    fi
    
    # Decrypt if encrypted
    if [[ "$backup_file" == *.gpg ]]; then
        backup_file=$(decrypt_backup "$backup_file")
    fi
    
    # Decompress if compressed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip "$backup_file"
        backup_file="${backup_file%.gz}"
    fi
    
    # Restore database
    restore_database "$backup_file"
    
    # Cleanup temp directory
    rm -rf "$BACKUP_TEMP_DIR"
    
    log_success "Recovery completed successfully"
}

# =============================================================================
# Command Line Interface
# =============================================================================

show_usage() {
    echo "Usage: $0 {backup|restore|list|verify|check-rpo}"
    echo ""
    echo "Commands:"
    echo "  backup                    - Perform full backup"
    echo "  restore <backup_name>     - Restore from backup"
    echo "  list                      - List available backups"
    echo "  verify <backup_file>      - Verify backup integrity"
    echo "  check-rpo                 - Check RPO compliance"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore database_20231201_120000.sql.gz.gpg"
    echo "  $0 list"
    echo "  $0 verify /var/backups/authcakes/database_20231201_120000.sql.gz"
    echo "  $0 check-rpo"
}

# Main execution
case "${1:-}" in
    backup)
        perform_full_backup
        ;;
    restore)
        if [ -z "${2:-}" ]; then
            echo "Error: backup file name required"
            show_usage
            exit 1
        fi
        perform_recovery "$2"
        ;;
    list)
        list_available_backups
        ;;
    verify)
        if [ -z "${2:-}" ]; then
            echo "Error: backup file path required"
            show_usage
            exit 1
        fi
        verify_backup_integrity "$2"
        ;;
    check-rpo)
        # Find latest backup timestamp
        latest_backup=$(ls -t "$BACKUP_LOCAL_DIR"/*.sql.gz* 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            backup_timestamp=$(stat -c %Y "$latest_backup")
            check_rpo_compliance "$(date -d @$backup_timestamp)"
        else
            log_error "No backups found for RPO check"
            exit 1
        fi
        ;;
    *)
        show_usage
        exit 1
        ;;
esac