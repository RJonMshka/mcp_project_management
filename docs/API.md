# API Documentation

This document describes the available APIs for the Project Management system.

## MCP Server API

The MCP (Model Context Protocol) server provides tools for AI assistants to manage projects and tasks.

### Available Tools

#### Project Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_projects` | List all projects | `status` (optional) |
| `get_project` | Get project details | `projectId` (required) |
| `create_project` | Create new project | `name`, `description`, `status`, `owner`, `tags` |
| `update_project` | Update project | `projectId`, plus any fields to update |
| `delete_project` | Delete project | `projectId` |
| `search_projects` | Search projects | `query`, `searchFields` |
| `get_project_stats` | Get project statistics | `projectId` (optional) |
| `update_project_progress` | Update project progress | `projectId` |

#### Task Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tasks` | List tasks | `projectId`, `status`, `assignee` (all optional) |
| `get_task` | Get task details | `projectId`, `taskId` |
| `create_task` | Create new task | `projectId`, `title`, `description`, `status`, `priority`, etc. |
| `update_task` | Update task | `projectId`, `taskId`, plus any fields to update |
| `delete_task` | Delete task | `projectId`, `taskId` |
| `search_tasks` | Search tasks | `query`, `projectId`, `searchFields` |

### Usage Example

```javascript
// List all projects
const projects = await mcpClient.callTool('list_projects');

// Get specific project
const project = await mcpClient.callTool('get_project', { projectId: 'abc123' });

// Create new task
const task = await mcpClient.callTool('create_task', {
  projectId: 'abc123',
  title: 'New Task',
  description: 'Task description',
  priority: 'high'
});
```

## GraphQL API

The GraphQL API provides a flexible interface for frontend and mobile applications.

### Endpoint

```
POST http://localhost:4000/graphql
```

### Schema Overview

#### Types

- **Project**: Main project entity
- **Task**: Task entity belonging to a project
- **ProjectStats**: Global statistics
- **ProjectSpecificStats**: Project-specific statistics

#### Queries

- `projects(filters)`: List projects
- `project(id)`: Get specific project
- `tasks(filters)`: List tasks
- `task(id, projectId)`: Get specific task
- `searchProjects(query, fields)`: Search projects
- `searchTasks(query, projectId, fields)`: Search tasks
- `globalStats`: Get global statistics
- `projectStats(projectId)`: Get project statistics

#### Mutations

- `createProject(input)`: Create new project
- `updateProject(input)`: Update project
- `deleteProject(id)`: Delete project
- `createTask(input)`: Create new task
- `updateTask(input)`: Update task
- `deleteTask(id, projectId)`: Delete task
- `updateProjectProgress(id)`: Update project progress

### GraphQL Playground

Visit `http://localhost:4000/graphql` to access the interactive GraphQL Playground for testing queries.

## Data Models

### Project Status Values
- `planning`: Project is in planning phase
- `active`: Project is actively being worked on
- `on_hold`: Project is temporarily paused
- `completed`: Project is finished
- `cancelled`: Project has been cancelled

### Task Status Values
- `not_started`: Task hasn't been started
- `in_progress`: Task is currently being worked on
- `completed`: Task is finished
- `blocked`: Task is blocked by dependencies

### Task Priority Values
- `low`: Low priority task
- `medium`: Medium priority task
- `high`: High priority task
- `critical`: Critical priority task

## Error Handling

### MCP Server Errors

The MCP server returns structured error responses:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Project with ID abc123 not found"
    }
  ]
}
```

### GraphQL Errors

GraphQL errors follow the standard format:

```json
{
  "errors": [
    {
      "message": "Project not found",
      "locations": [{"line": 2, "column": 3}],
      "path": ["project"]
    }
  ]
}
```

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider adding:

- Request rate limiting
- Connection pooling
- Query complexity analysis
- Timeout handling

## Security Considerations

### Database Security
- All queries use parameterized statements
- Input validation on all endpoints
- Proper error handling without information leakage

### CORS Configuration
- Development: Allow all origins (`*`)
- Production: Specify allowed origins explicitly

### Authentication
- Currently no authentication implemented
- Consider adding JWT tokens for production use
- Implement proper user session management