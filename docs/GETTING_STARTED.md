# Getting Started

This guide will help you get the Project Management MCP Server up and running quickly.

## Prerequisites

- **Bun runtime** (>=1.0.0)
- **Docker** and **Docker Compose**
- **PostgreSQL** (via Docker)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start the Database

```bash
docker-compose up -d
```

### 3. Verify Database Connection

```bash
bun run test:db
```

### 4. Start the MCP Server

```bash
bun run start
```

### 5. Start the GraphQL Server (Optional)

```bash
bun run graphql:start
```

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=mcp_user
DB_PASSWORD=mcp_password

# GraphQL Server Configuration
GRAPHQL_PORT=4000
GRAPHQL_HOST=localhost
NODE_ENV=development
```

## Testing

Run all tests:

```bash
bun run tests/run_all_tests.ts
```

Or run individual tests:

```bash
# Test MCP server
bun run test

# Test database connection
bun run test:db

# Test GraphQL API
bun run test:graphql
```

## Troubleshooting

### Database Connection Issues

1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Check database status:
   ```bash
   docker-compose ps
   ```

3. Test database connection:
   ```bash
   docker exec project_management_db psql -U mcp_user -d project_management -c "SELECT version();"
   ```

### GraphQL Server Issues

1. Check if the server is running:
   ```bash
   curl http://localhost:4000/graphql
   ```

2. Check server logs for errors

3. Verify database connection is working

## Next Steps

- Read the [API Documentation](API.md) for available endpoints
- Check out [GraphQL Examples](../examples/graphql_examples.md) for query examples
- Review [Development Guide](DEVELOPMENT.md) for contributing