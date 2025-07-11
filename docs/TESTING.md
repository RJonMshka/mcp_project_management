# Testing Guide

This guide covers all testing aspects of the Project Management MCP Server.

## Test Structure

```
tests/
├── test_server.ts          # MCP server instantiation tests
├── test_database.ts        # Database connection and operations tests
├── test_detailed_query.js  # GraphQL API comprehensive tests
└── run_all_tests.ts        # Test runner and orchestrator
```

## Running Tests

### Quick Test Commands

```bash
# Run all tests
bun run tests/run_all_tests.ts

# Run individual tests
bun run test           # MCP server tests
bun run test:db        # Database tests
bun run test:graphql   # GraphQL API tests
```

### Test Prerequisites

Before running tests, ensure:

1. **Database is running**:
   ```bash
   docker-compose up -d
   ```

2. **Dependencies are installed**:
   ```bash
   bun install
   ```

3. **Environment variables are set**:
   ```bash
   cp .env.example .env
   ```

## Test Categories

### 1. MCP Server Tests (`test_server.ts`)

**Purpose**: Verify MCP server instantiation and configuration

**What it tests**:
- Server class instantiation
- Database service integration
- Configuration loading
- Error handling

**Expected output**:
```
🔍 Testing MCP Server instantiation...
✅ MCP Server instantiated successfully
✅ Database configuration loaded from environment variables
✅ All methods converted to use shared database service
```

**How to run**:
```bash
bun run test
```

### 2. Database Tests (`test_database.ts`)

**Purpose**: Verify database connectivity and basic operations

**What it tests**:
- Database connection establishment
- Project retrieval
- Task retrieval
- Data integrity

**Expected output**:
```
🔍 Testing database connection...
✅ Database service created
✅ Database connected successfully
📊 Found 1 projects
📋 First project: "learn_rust_with_ai"
📝 Found 20 tasks for this project
🎉 Database connection test successful!
```

**How to run**:
```bash
bun run test:db
```

### 3. GraphQL API Tests (`test_detailed_query.js`)

**Purpose**: Comprehensive testing of GraphQL API endpoints

**What it tests**:
- Basic project queries
- Detailed project queries with tasks
- Global statistics
- Search functionality
- Error handling

**Expected output**:
```
🚀 Starting GraphQL API Tests
🔍 Testing basic project list query...
✅ Basic query successful
📊 Found 1 project(s)
🔍 Testing detailed project query with tasks...
✅ Detailed query successful
📋 Project: "learn_rust_with_ai"
📊 Tasks: 20 loaded
🎉 GraphQL API is working correctly with the database snapshot
```

**How to run**:
```bash
bun run test:graphql
```

### 4. All Tests Runner (`run_all_tests.ts`)

**Purpose**: Run all tests in sequence and report results

**What it does**:
- Executes all test suites
- Reports pass/fail status
- Provides summary statistics
- Exits with appropriate code

**Expected output**:
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

## Test Data

### Database Snapshot

Tests use the database snapshot located at:
```
snapshots/snapshot_20250709_222302.sql
```

This snapshot contains:
- **1 Project**: "learn_rust_with_ai" (Rust learning curriculum)
- **20 Tasks**: Complete set of Rust learning tasks
- **Various priorities**: Critical, High, Medium, Low

### Test Project Details

```json
{
  "id": "0b3dfaf1-239",
  "name": "learn_rust_with_ai",
  "description": "A comprehensive project to learn all of Rust's features...",
  "status": "planning",
  "owner": "me",
  "tags": ["rust", "learning", "programming", "tutorial"],
  "taskCount": 20,
  "completedTaskCount": 0
}
```

## Adding New Tests

### Test File Template

```typescript
#!/usr/bin/env bun

import { /* required imports */ } from '../src/...';

async function testNewFeature() {
  console.log('🔍 Testing new feature...');
  
  try {
    // Test setup
    const service = new SomeService();
    
    // Test execution
    const result = await service.doSomething();
    
    // Assertions
    if (!result) {
      throw new Error('Expected result to be truthy');
    }
    
    console.log('✅ New feature test passed');
    
  } catch (error) {
    console.error('❌ New feature test failed:', error);
    process.exit(1);
  }
}

testNewFeature();
```

### Adding Test to Runner

Update `tests/run_all_tests.ts`:

```typescript
const tests = [
  // ... existing tests
  {
    name: 'New Feature Test',
    command: ['bun', 'run', 'tests/test_new_feature.ts']
  }
];
```

## GraphQL Test Examples

### Basic Query Test

```javascript
const query = `
  query GetAllProjects {
    projects {
      id
      name
      status
      progress
    }
  }
`;

const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
});

const result = await response.json();
```

### Mutation Test

```javascript
const mutation = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      status
    }
  }
`;

const variables = {
  input: {
    name: "Test Project",
    description: "Test Description",
    status: "PLANNING"
  }
};

const response = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: mutation, variables }),
});
```

## Performance Testing

### Database Performance

```bash
# Test database query performance
time bun run test:db
```

### GraphQL Performance

```bash
# Test GraphQL query performance
time bun run test:graphql
```

### Load Testing

Use tools like Apache Bench or Artillery for load testing:

```bash
# Install artillery
npm install -g artillery

# Create artillery config
cat > artillery-config.yml << EOF
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "GraphQL Query"
    requests:
      - post:
          url: "/graphql"
          json:
            query: "query { projects { id name } }"
EOF

# Run load test
artillery run artillery-config.yml
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: project_management
          POSTGRES_USER: mcp_user
          POSTGRES_PASSWORD: mcp_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
    
    - name: Install dependencies
      run: bun install
    
    - name: Run tests
      run: bun run tests/run_all_tests.ts
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: project_management
        DB_USER: mcp_user
        DB_PASSWORD: mcp_password
```

## Troubleshooting Tests

### Common Test Failures

1. **Database connection failed**
   ```bash
   # Check if database is running
   docker-compose ps
   
   # Check database logs
   docker-compose logs postgres
   
   # Test manual connection
   docker exec project_management_db psql -U mcp_user -d project_management -c "SELECT 1;"
   ```

2. **GraphQL server not responding**
   ```bash
   # Check if server is running
   curl http://localhost:4000/graphql
   
   # Start server manually
   bun run graphql:start
   ```

3. **Test timeouts**
   ```bash
   # Increase timeout in test files
   # Check system resources
   # Verify database performance
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* bun run tests/run_all_tests.ts

# Run tests with verbose output
bun run test:db --verbose

# Check test logs
tail -f test-output.log
```

## Best Practices

### Test Writing

1. **Clear test names**: Use descriptive names
2. **Isolated tests**: Each test should be independent
3. **Setup/teardown**: Clean up after tests
4. **Error handling**: Test both success and failure cases
5. **Documentation**: Comment complex test logic

### Test Data

1. **Consistent data**: Use known test data
2. **Clean state**: Reset data between tests
3. **Realistic data**: Use representative test data
4. **Edge cases**: Test boundary conditions

### Test Maintenance

1. **Regular updates**: Update tests with code changes
2. **Performance monitoring**: Track test execution time
3. **Flaky test detection**: Identify and fix unstable tests
4. **Test coverage**: Ensure adequate coverage

## Test Coverage

### Current Coverage

- **MCP Server**: Server instantiation, configuration
- **Database**: Connection, basic operations
- **GraphQL**: Queries, mutations, error handling
- **Integration**: End-to-end workflows

### Missing Coverage

- Authentication/authorization
- Rate limiting
- Performance under load
- Error recovery
- Data validation edge cases

### Improving Coverage

1. Add unit tests for individual functions
2. Add integration tests for complex workflows
3. Add performance benchmarks
4. Add security tests
5. Add API contract tests