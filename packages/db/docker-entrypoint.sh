#!/bin/bash
set -e

# Custom entrypoint that wraps the standard PostgreSQL entrypoint
# Conditionally enables WAL archiving based on ENABLE_BACKUPS

# Check if we should restore from backup BEFORE PostgreSQL starts
if [ -n "${RESTORE_FROM_BACKUP}" ]; then
    echo "RESTORE_FROM_BACKUP is set to: ${RESTORE_FROM_BACKUP}"
    
    # Check if data directory is empty or doesn't exist
    if [ ! -d "$PGDATA" ] || [ -z "$(ls -A $PGDATA 2>/dev/null)" ]; then
        echo "Data directory is empty. Starting restore from backup: ${RESTORE_FROM_BACKUP}"
        
        # Ensure we have required env vars for restoration
        if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ] || [ -z "${WALG_S3_PREFIX}" ]; then
            echo "ERROR: Cannot restore - missing AWS credentials"
            exit 1
        fi
        
        # Set WAL-G environment
        export PGUSER="${POSTGRES_USER}"
        export PGDATABASE="${POSTGRES_DB}"
        export AWS_ENDPOINT="${AWS_ENDPOINT}"
        
        # Create data directory if it doesn't exist
        mkdir -p "$PGDATA"
        chown postgres:postgres "$PGDATA"
        
        # Restore the backup
        echo "Running: wal-g backup-fetch $PGDATA ${RESTORE_FROM_BACKUP}"
        AWS_REGION="${AWS_REGION:-us-east-1}"
        su postgres -s /bin/bash -c "AWS_REGION=${AWS_REGION} AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} AWS_ENDPOINT=${AWS_ENDPOINT} AWS_S3_FORCE_PATH_STYLE=${AWS_S3_FORCE_PATH_STYLE} WALG_S3_PREFIX=${WALG_S3_PREFIX} wal-g backup-fetch $PGDATA ${RESTORE_FROM_BACKUP}"
        
        # Create recovery configuration
        cat > "$PGDATA/postgresql.auto.conf" <<EOF
restore_command = 'AWS_REGION=${AWS_REGION} AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} AWS_ENDPOINT=${AWS_ENDPOINT} AWS_S3_FORCE_PATH_STYLE=${AWS_S3_FORCE_PATH_STYLE} WALG_S3_PREFIX=${WALG_S3_PREFIX} wal-g wal-fetch %f %p'
recovery_target_timeline = 'latest'
${RECOVERY_TARGET_TIME:+recovery_target_time = '${RECOVERY_TARGET_TIME}'}
${RECOVERY_TARGET_XID:+recovery_target_xid = '${RECOVERY_TARGET_XID}'}
${RECOVERY_TARGET_NAME:+recovery_target_name = '${RECOVERY_TARGET_NAME}'}
${RECOVERY_TARGET_ACTION:+recovery_target_action = '${RECOVERY_TARGET_ACTION}'}
EOF
        chown postgres:postgres "$PGDATA/postgresql.auto.conf"
        
        # Create recovery signal for point-in-time recovery
        touch "$PGDATA/recovery.signal"
        chown postgres:postgres "$PGDATA/recovery.signal"
        
        if [ -n "${RECOVERY_TARGET_TIME}" ]; then
            echo "Restore will recover to time: ${RECOVERY_TARGET_TIME}"
        elif [ -n "${RECOVERY_TARGET_XID}" ]; then
            echo "Restore will recover to transaction: ${RECOVERY_TARGET_XID}"
        elif [ -n "${RECOVERY_TARGET_NAME}" ]; then
            echo "Restore will recover to savepoint: ${RECOVERY_TARGET_NAME}"
        else
            echo "Restore will recover to latest available point"
        fi
        echo "Restore completed successfully"
    else
        echo "WARNING: Data directory is not empty. Skipping restore to prevent data loss."
        echo "To restore, remove all data first: rm -rf $PGDATA/*"
    fi
fi

if [ "${ENABLE_BACKUPS}" = "true" ]; then
    echo "WAL-G backup enabled, configuring PostgreSQL for archiving..."
    
    # Required WAL-G environment variables check
    if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ] || [ -z "${WALG_S3_PREFIX}" ]; then
        echo "ERROR: WAL-G backup enabled but missing required environment variables:"
        echo "  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, WALG_S3_PREFIX"
        exit 1
    fi
    
    # Map PostgreSQL env vars to WAL-G env vars
    export PGUSER="${POSTGRES_USER}"
    export PGDATABASE="${POSTGRES_DB}"
    
    # Write env vars to a file that can be sourced by docker exec
    cat > /etc/wal-g.env <<EOF
export PGUSER="${POSTGRES_USER}"
export PGDATABASE="${POSTGRES_DB}"
export AWS_ENDPOINT="${AWS_ENDPOINT}"
EOF
    
    # Set defaults
    export ARCHIVE_MODE="${ARCHIVE_MODE:-on}"
    export ARCHIVE_TIMEOUT="${ARCHIVE_TIMEOUT:-60}"
    export ARCHIVE_COMMAND="${ARCHIVE_COMMAND:-/usr/local/bin/wal-g wal-push %p}"
    
    # Generate postgresql.conf from template using gomplate
    gomplate -f /etc/postgresql/postgresql.conf.template -o /etc/postgresql/postgresql.conf
    
    echo "Archive configuration:"
    echo "  archive_mode = ${ARCHIVE_MODE}"
    echo "  archive_timeout = ${ARCHIVE_TIMEOUT}s"
    echo "  archive_command = ${ARCHIVE_COMMAND}"
    echo "Storage configuration:"
    echo "  AWS_ENDPOINT = ${AWS_ENDPOINT:-default}"
    echo "  WALG_S3_PREFIX = ${WALG_S3_PREFIX}"
    echo "  WALG_COMPRESSION_METHOD = ${WALG_COMPRESSION_METHOD:-lz4}"
    
    # Start PostgreSQL with custom config
    exec docker-entrypoint.sh postgres -c config_file=/etc/postgresql/postgresql.conf
else
    echo "WAL-G backup disabled (ENABLE_BACKUPS != true)"
    # Use standard PostgreSQL entrypoint
    exec docker-entrypoint.sh "$@"
fi
