#!/bin/bash

# Script to restore database from a snapshot
# Usage: ./scripts/restore_snapshot.sh [snapshot_file]

set -e

if [ $# -eq 0 ]; then
    echo "📋 Available snapshots:"
    ls -la snapshots/ 2>/dev/null || echo "   No snapshots found"
    echo ""
    echo "Usage: $0 <snapshot_file>"
    echo "Example: $0 snapshots/snapshot_20250710_221900.sql"
    exit 1
fi

SNAPSHOT_FILE="$1"

if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "❌ Error: Snapshot file '$SNAPSHOT_FILE' not found"
    exit 1
fi

echo "🔄 Restoring database from snapshot: $SNAPSHOT_FILE"

# Check if container is running
if ! docker-compose ps | grep -q "project_management_db.*Up"; then
    echo "❌ Error: PostgreSQL container is not running. Please start it with: docker-compose up -d"
    exit 1
fi

# Clear existing data
echo "🗑️  Clearing existing data..."
docker exec project_management_db psql -U mcp_user -d project_management -c "TRUNCATE TABLE tasks, projects RESTART IDENTITY CASCADE;"

# Restore from snapshot
echo "📦 Restoring data..."
docker exec -i project_management_db psql -U mcp_user -d project_management < "$SNAPSHOT_FILE"

echo "✅ Database restored successfully from $SNAPSHOT_FILE"

# Show summary
echo "📊 Database summary:"
docker exec project_management_db psql -U mcp_user -d project_management -c "SELECT 
    (SELECT COUNT(*) FROM projects) as projects,
    (SELECT COUNT(*) FROM tasks) as tasks;"