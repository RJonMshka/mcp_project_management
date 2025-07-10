#!/bin/bash

# Script to create a database snapshot from the current running PostgreSQL instance
# Usage: ./scripts/create_snapshot.sh

set -e

echo "🔄 Creating database snapshot..."

# Check if container is running
if ! docker-compose ps | grep -q "project_management_db.*Up"; then
    echo "❌ Error: PostgreSQL container is not running. Please start it with: docker-compose up -d"
    exit 1
fi

# Create snapshot directory if it doesn't exist
mkdir -p snapshots

# Generate timestamp for snapshot file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SNAPSHOT_FILE="snapshots/snapshot_${TIMESTAMP}.sql"

echo "📸 Creating snapshot at: $SNAPSHOT_FILE"

# Create the data dump
docker exec project_management_db pg_dump -U mcp_user -d project_management --data-only --inserts > "$SNAPSHOT_FILE"

echo "✅ Snapshot created successfully!"
echo "📁 File: $SNAPSHOT_FILE"

# Also update the init script with the latest data
echo "🔄 Updating initialization script..."

cat > "init-db/002_insert_sample_data.sql" << 'EOF'
-- Insert sample data from database snapshot
-- This data will be loaded automatically when the database starts fresh

EOF

# Append the data dump to the init script
docker exec project_management_db pg_dump -U mcp_user -d project_management --data-only --inserts | grep -E "^INSERT INTO" >> "init-db/002_insert_sample_data.sql"

# Add the project summary view
cat >> "init-db/002_insert_sample_data.sql" << 'EOF'

-- Create helpful views for easier querying
CREATE VIEW IF NOT EXISTS project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.progress,
    p.owner,
    p.tags,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'not_started' THEN 1 END) as not_started_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.description, p.status, p.progress, p.owner, p.tags, p.created_at, p.updated_at;
EOF

echo "✅ Initialization script updated!"
echo ""
echo "🚀 Next time you start with 'docker-compose up -d', this data will be loaded automatically."
echo "📋 Summary:"
echo "   - Snapshot saved: $SNAPSHOT_FILE"
echo "   - Init script updated: init-db/002_insert_sample_data.sql"