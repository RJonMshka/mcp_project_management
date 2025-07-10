# Project Management MCP Server with PostgreSQL

This MCP server has been updated to use PostgreSQL instead of storing data in a JSON file.

## Prerequisites

- Bun runtime
- Docker and Docker Compose
- Colima (for macOS users) or Docker Desktop

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start Docker runtime:**
   
   For macOS with Colima:
   ```bash
   colima start
   ```
   
   For Docker Desktop users:
   ```bash
   # Ensure Docker Desktop is running
   ```

3. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

4. **Configure environment variables:**
   Copy `.env.example` to `.env` and modify if needed:
   ```bash
   cp .env.example .env
   ```

5. **Start the MCP server:**
   ```bash
   bun run start
   ```

## Database Configuration

The server uses the following environment variables:

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: project_management)
- `DB_USER`: Database user (default: mcp_user)
- `DB_PASSWORD`: Database password (default: mcp_password)

## Database Schema

The database contains two main tables:

### Projects Table
- `id`: Primary key (VARCHAR)
- `name`: Project name
- `description`: Project description
- `status`: Project status (planning, active, on_hold, completed, cancelled)
- `start_date`: Project start date
- `end_date`: Project end date
- `progress`: Progress percentage (0-100)
- `owner`: Project owner
- `tags`: Array of tags
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Tasks Table
- `id`: Primary key (VARCHAR)
- `project_id`: Foreign key to projects table
- `title`: Task title
- `description`: Task description
- `status`: Task status (not_started, in_progress, completed, blocked)
- `priority`: Task priority (low, medium, high, critical)
- `assignee`: Task assignee
- `due_date`: Due date
- `progress`: Progress percentage (0-100)
- `dependencies`: Array of task IDs
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Available Tools

All the original MCP tools are still available:

- `list_projects`: List all projects
- `get_project`: Get project details
- `create_project`: Create new project
- `update_project`: Update project
- `delete_project`: Delete project
- `list_tasks`: List tasks
- `get_task`: Get task details
- `create_task`: Create new task
- `update_task`: Update task
- `delete_task`: Delete task
- `update_project_progress`: Update project progress
- `search_projects`: Search projects
- `search_tasks`: Search tasks
- `get_project_stats`: Get project statistics

## Development

Run the server in development mode:
```bash
bun run dev
```

Build the server:
```bash
bun run build
```

## Testing

Test server instantiation:
```bash
bun run test_server.ts
```

## Database Snapshots

### Creating Snapshots

To create a snapshot of the current database state:
```bash
./scripts/create_snapshot.sh
```

This will:
- Create a timestamped snapshot file in `snapshots/`
- Update the initialization script so the current data loads automatically on fresh starts

### Restoring from Snapshots

To restore the database from a previous snapshot:
```bash
./scripts/restore_snapshot.sh snapshots/snapshot_YYYYMMDD_HHMMSS.sql
```

### Automatic Data Loading

The database automatically loads sample data when started fresh:
- Sample data is stored in `init-db/002_insert_sample_data.sql`
- This includes a complete Rust learning project with 20 tasks
- A helpful `project_summary` view is also created

## Troubleshooting

### Docker Issues

If you encounter Docker connection errors:

1. **Check if Colima is running:**
   ```bash
   colima status
   ```

2. **Start Colima if not running:**
   ```bash
   colima start
   ```

3. **Verify Docker is working:**
   ```bash
   docker info
   ```

### Database Issues

1. **Check container status:**
   ```bash
   docker-compose ps
   ```

2. **View container logs:**
   ```bash
   docker-compose logs postgres
   ```

3. **Test database connection:**
   ```bash
   docker exec project_management_db psql -U mcp_user -d project_management -c "SELECT version();"
   ```

## Migration from JSON

The server has been completely migrated from JSON file storage to PostgreSQL. All data operations now use proper SQL queries with parameterized statements for security.

## Docker Services

The `docker-compose.yml` includes:
- PostgreSQL 15 database
- Automatic database initialization with schema
- Health checks
- Data persistence via Docker volumes