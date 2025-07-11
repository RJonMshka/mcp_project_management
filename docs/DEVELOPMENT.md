# Development Guide

This guide covers development workflows, testing, and contributing to the Project Management MCP Server.

## Project Structure

```
project-management-mcp-server/
├── src/
│   ├── servers/
│   │   ├── mcp_server.ts       # MCP protocol server
│   │   └── graphql_server.ts   # GraphQL API server
│   ├── graphql/
│   │   ├── resolvers.ts        # GraphQL resolvers
│   │   └── schema.ts           # GraphQL schema (legacy)
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
│   └── DEVELOPMENT.md          # This file
├── scripts/
│   ├── create_snapshot.sh      # Database snapshot creation
│   └── restore_snapshot.sh     # Database snapshot restoration
├── init-db/
│   └── 001_create_tables.sql   # Database schema
└── snapshots/
    └── snapshot_*.sql          # Database snapshots
```

## Development Setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd project-management-mcp-server
bun install
```

### 2. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d

# Verify database
bun run test:db
```

### 3. Development Servers

```bash
# Start MCP server in development mode
bun run dev

# Start GraphQL server in development mode
bun run graphql:dev
```

## Available Scripts

### Core Scripts

- `bun run start` - Start MCP server
- `bun run dev` - Start MCP server with hot reload
- `bun run build` - Build MCP server for production
- `bun run graphql:start` - Start GraphQL server
- `bun run graphql:dev` - Start GraphQL server with hot reload
- `bun run graphql:build` - Build GraphQL server for production

### Testing Scripts

- `bun run test` - Test MCP server instantiation
- `bun run test:db` - Test database connection
- `bun run test:graphql` - Test GraphQL API
- `bun run tests/run_all_tests.ts` - Run all tests

### Utility Scripts

- `./scripts/create_snapshot.sh` - Create database snapshot
- `./scripts/restore_snapshot.sh <file>` - Restore database snapshot
- `./examples/curl_examples.sh` - Run cURL examples

## Testing

### Running Tests

```bash
# Run all tests
bun run tests/run_all_tests.ts

# Run specific tests
bun run test           # MCP server
bun run test:db        # Database
bun run test:graphql   # GraphQL API
```

### Test Structure

Each test file follows this pattern:

```typescript
#!/usr/bin/env bun

import { /* dependencies */ } from '../src/...';

async function testSomething() {
  console.log('🔍 Testing something...');
  
  try {
    // Test logic here
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSomething();
```

### Adding New Tests

1. Create a new test file in `tests/` directory
2. Follow the existing naming convention: `test_<feature>.ts`
3. Add the test to `run_all_tests.ts`
4. Update package.json scripts if needed

## Database Development

### Schema Changes

1. Modify `init-db/001_create_tables.sql`
2. Create a new migration file if needed
3. Update `shared/database-service.ts` if needed
4. Test changes locally
5. Create a snapshot: `./scripts/create_snapshot.sh`

### Database Snapshots

```bash
# Create snapshot
./scripts/create_snapshot.sh

# Restore snapshot
./scripts/restore_snapshot.sh snapshots/snapshot_YYYYMMDD_HHMMSS.sql

# List snapshots
ls -la snapshots/
```

## GraphQL Development

### Schema Changes

1. Modify the schema in `src/servers/graphql_server.ts`
2. Update resolvers in `src/graphql/resolvers.ts`
3. Test changes with GraphQL Playground
4. Add examples to `examples/graphql_examples.md`

### Adding New Resolvers

```typescript
// In src/graphql/resolvers.ts
export const resolvers = {
  Query: {
    newQuery: async (parent, args, context) => {
      // Implementation
    }
  },
  Mutation: {
    newMutation: async (parent, args, context) => {
      // Implementation
    }
  }
};
```

## MCP Server Development

### Adding New Tools

1. Add tool definition in `setupToolHandlers()` method
2. Implement the tool handler method
3. Add the tool to the switch statement in `CallToolRequestSchema` handler
4. Test the tool
5. Update documentation

### Tool Handler Pattern

```typescript
private async newTool(args: any) {
  try {
    // Validate arguments
    // Call database service
    // Format response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Tool failed: ${error.message}`);
  }
}
```

## Database Service Development

### Adding New Methods

```typescript
// In src/shared/database-service.ts
async newMethod(params: any): Promise<any> {
  const client = await this.getClient();
  try {
    const result = await client.query('SELECT ...', [params]);
    return result.rows.map(this.mapRow);
  } finally {
    await client.end();
  }
}
```

### Best Practices

- Always use parameterized queries
- Properly handle database connections (open/close)
- Use transactions for multi-step operations
- Add proper error handling
- Map database rows to TypeScript types

## Code Style

### TypeScript Guidelines

- Use strict TypeScript settings
- Define interfaces for all data structures
- Use async/await instead of promises
- Handle errors properly
- Add JSDoc comments for public methods

### Database Guidelines

- Use parameterized queries only
- Handle connection lifecycle properly
- Use transactions for data consistency
- Add proper indexes for performance
- Validate input data

### GraphQL Guidelines

- Use proper GraphQL naming conventions
- Add descriptions to schema fields
- Handle null values appropriately
- Use proper error handling
- Follow GraphQL best practices

## Performance Considerations

### Database

- Use connection pooling in production
- Add proper indexes
- Optimize queries
- Use EXPLAIN ANALYZE for query performance
- Consider read replicas for scaling

### GraphQL

- Implement query complexity analysis
- Add caching layers
- Use DataLoader for N+1 query prevention
- Monitor query performance
- Add rate limiting

### General

- Use proper logging
- Monitor memory usage
- Profile application performance
- Use CDN for static assets
- Implement health checks

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Run all tests
6. Update documentation
7. Submit a pull request

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database backups set up
- [ ] Monitoring and logging configured
- [ ] Security headers added
- [ ] Rate limiting implemented
- [ ] Health checks added
- [ ] SSL/TLS certificates configured
- [ ] Load balancing configured

### Environment Variables

```bash
# Production environment
NODE_ENV=production
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=project_management
DB_USER=prod_user
DB_PASSWORD=secure_password
GRAPHQL_PORT=4000
GRAPHQL_HOST=0.0.0.0
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check if Docker is running
   - Verify database credentials
   - Check network connectivity

2. **GraphQL server not starting**
   - Check if port is available
   - Verify schema compilation
   - Check resolver implementation

3. **MCP server errors**
   - Check tool implementations
   - Verify database service methods
   - Check error handling

### Debug Mode

```bash
# Enable debug logging
DEBUG=* bun run start

# Check server logs
docker-compose logs -f

# Test database connection
bun run test:db
```