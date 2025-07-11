# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

```
project-management-mcp-server/
├── src/
│   ├── servers/
│   │   ├── mcp_server.ts       # MCP protocol server
│   │   └── graphql_server.ts   # GraphQL API server
│   ├── graphql/
│   │   ├── resolvers.ts        # GraphQL resolvers
│   │   └── schema.ts           # GraphQL schema definitions
│   └── shared/
│       └── database-service.ts # Shared database operations
├── tests/
│   ├── test_server.ts          # MCP server tests
│   ├── test_database.ts        # Database connection tests
│   ├── test_detailed_query.js  # GraphQL API tests
│   └── run_all_tests.ts        # Test runner
├── examples/
│   ├── graphql_examples.md     # GraphQL query examples
│   └── curl_examples.sh        # cURL examples
├── docs/
│   ├── GETTING_STARTED.md      # Quick start guide
│   ├── API.md                  # API documentation
│   ├── DEVELOPMENT.md          # Development guide
│   └── TESTING.md              # Testing guide
├── scripts/
│   ├── create_snapshot.sh      # Database snapshot creation
│   └── restore_snapshot.sh     # Database snapshot restoration
├── init-db/
│   └── 001_create_tables.sql   # Database schema
└── snapshots/
    └── snapshot_*.sql          # Database snapshots
```

## Development Commands

### Core Commands
- `bun run start` - Start the MCP server
- `bun run dev` - Start the MCP server in development mode with hot reload
- `bun run build` - Build the MCP server for production (outputs to ./dist)
- `bun run graphql:start` - Start the GraphQL server
- `bun run graphql:dev` - Start GraphQL server in development mode with hot reload
- `bun run graphql:build` - Build the GraphQL server (outputs to ./dist-graphql)
- `bun install` - Install dependencies

### Database Commands
- `docker-compose up -d` - Start PostgreSQL database
- `docker-compose down` - Stop PostgreSQL database
- `docker-compose ps` - Check container status
- `docker-compose logs postgres` - View database logs
- `./scripts/create_snapshot.sh` - Create database snapshot
- `./scripts/restore_snapshot.sh <snapshot_file>` - Restore database from snapshot

### Testing Commands
- `bun run tests/run_all_tests.ts` - Run all tests
- `bun run test` - Test MCP server instantiation
- `bun run test:db` - Test database connection
- `bun run test:graphql` - Test GraphQL API
- `./examples/curl_examples.sh` - Run cURL examples

## Architecture Overview

This is a dual-server project management system with both MCP and GraphQL APIs:

### Technology Stack
- **Runtime**: Bun (requires >=1.0.0)
- **Database**: PostgreSQL 15 (via Docker)
- **MCP SDK**: @modelcontextprotocol/sdk
- **GraphQL**: GraphQL Yoga server
- **Database Client**: pg (node-postgres)

### Core Components

#### MCP Server (`src/servers/mcp_server.ts`)
- Main server implementation using MCP SDK
- Handles 14 different tools for project/task management
- Uses shared database service for operations
- Database connections are properly managed

#### GraphQL Server (`src/servers/graphql_server.ts`)
- GraphQL Yoga server with built-in playground
- Complete CRUD operations for projects and tasks
- CORS configured for frontend/mobile consumption
- Uses shared database service for operations

#### Shared Database Service (`src/shared/database-service.ts`)
- Centralized database operations
- Eliminates code duplication between servers
- All queries use parameterized statements for security
- Proper connection management (open/close per operation)

#### Database Schema (`init-db/001_create_tables.sql`)
- **Projects table**: Stores project metadata with status tracking
- **Tasks table**: Stores task details with foreign key to projects
- **Automatic triggers**: Update `updated_at` timestamps on modifications
- **Indexes**: Optimized for common query patterns

### Database Configuration

Environment variables (with defaults):
- `DB_HOST` (localhost)
- `DB_PORT` (5432)
- `DB_NAME` (project_management)
- `DB_USER` (mcp_user)
- `DB_PASSWORD` (mcp_password)
- `GRAPHQL_PORT` (4000)
- `GRAPHQL_HOST` (localhost)

### Available MCP Tools

#### Project Management
- `list_projects` - List all projects with filtering
- `get_project` - Get project details with all tasks
- `create_project` - Create new project
- `update_project` - Update project details
- `delete_project` - Delete project and all tasks
- `update_project_progress` - Auto-calculate progress from tasks
- `search_projects` - Search projects by name/description/tags
- `get_project_stats` - Get project statistics

#### Task Management
- `list_tasks` - List tasks with filtering options
- `get_task` - Get detailed task information
- `create_task` - Create new task in project
- `update_task` - Update task details
- `delete_task` - Delete task
- `search_tasks` - Search tasks by title/description/assignee

### GraphQL API Features

#### Queries
- `projects` - List projects with filtering
- `project` - Get specific project with tasks
- `tasks` - List tasks with filtering
- `task` - Get specific task
- `searchProjects` - Search projects by query
- `searchTasks` - Search tasks by query
- `globalStats` - Get global statistics
- `projectStats` - Get project-specific statistics

#### Mutations
- `createProject` - Create new project
- `updateProject` - Update project
- `deleteProject` - Delete project
- `createTask` - Create new task
- `updateTask` - Update task
- `deleteTask` - Delete task
- `updateProjectProgress` - Update project progress

### Data Models

#### Project Status Values
- `planning`, `active`, `on_hold`, `completed`, `cancelled`

#### Task Status Values
- `not_started`, `in_progress`, `completed`, `blocked`

#### Task Priority Values
- `low`, `medium`, `high`, `critical`

## Development Setup

### Prerequisites
1. **Docker/Colima**: For PostgreSQL database
2. **Bun Runtime**: For running the TypeScript servers
3. **Database must be running**: Both servers will fail without PostgreSQL connection

### Quick Start
1. Start database: `docker-compose up -d`
2. Install dependencies: `bun install`
3. Verify database: `bun run test:db`
4. Start MCP server: `bun run start`
5. Start GraphQL server (optional): `bun run graphql:start`

### Development Workflow

#### MCP Server Development
1. Start database: `docker-compose up -d`
2. Start development server: `bun run dev`
3. Test changes: `bun run test`

#### GraphQL Server Development
1. Start database: `docker-compose up -d`
2. Start GraphQL server: `bun run graphql:dev`
3. Access GraphQL Playground: `http://localhost:4000/graphql`
4. Test API: `bun run test:graphql`

### Testing

Run all tests:
```bash
bun run tests/run_all_tests.ts
```

Expected output:
```
🚀 Running all tests...
🔍 Running MCP Server Test...
✅ MCP Server Test passed
🔍 Running Database Connection Test...
✅ Database Connection Test passed
🔍 Running GraphQL API Test...
✅ GraphQL API Test passed
📊 Test Results: 3 passed, 0 failed
🎉 All tests passed!
```

### Important Notes

- **Security separation**: MCP server (./dist) and GraphQL server (./dist-graphql) have separate distribution folders
- **Shared database service**: Both servers use the same database abstraction layer
- **Environment variables**: Configure ports and hosts via `.env` file
- **CORS configuration**: Properly configured for frontend/mobile consumption
- **All database operations** use proper connection management
- **Server generates** 12-character UUIDs for new records
- **Database schema** includes foreign key constraints and cascading deletes
- **Progress calculations** are automatic for projects based on task completion
- **All timestamps** are stored in UTC and returned as ISO strings

## Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** - Quick start guide
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflows
- **[Testing Guide](docs/TESTING.md)** - Testing procedures
- **[GraphQL Examples](examples/graphql_examples.md)** - Working GraphQL queries
- **[cURL Examples](examples/curl_examples.sh)** - REST API examples

## Test Data

The project includes a database snapshot with test data:
- **1 Project**: "learn_rust_with_ai" (Rust learning curriculum)
- **20 Tasks**: Complete set of Rust learning tasks
- **Various priorities**: Critical, High, Medium, Low
- **Project ID**: "0b3dfaf1-239" (used in tests and examples)