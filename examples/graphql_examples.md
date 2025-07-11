# GraphQL Request Examples

This document contains example GraphQL queries and mutations for the Project Management API using the current database snapshot.

## Database Context

The current database contains:
- **1 Project**: "learn_rust_with_ai" (ID: 0b3dfaf1-239)
- **20 Tasks**: Comprehensive Rust learning curriculum
- **Status**: Project is in "planning" phase, all tasks are "not_started"

## 1. Fetch All Projects (Summary)

```graphql
query GetAllProjects {
  projects {
    id
    name
    description
    status
    progress
    owner
    tags
    createdAt
    updatedAt
    taskCount
    completedTaskCount
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "projects": [
      {
        "id": "0b3dfaf1-239",
        "name": "learn_rust_with_ai",
        "description": "A comprehensive project to learn all of Rust's features by building practical applications...",
        "status": "PLANNING",
        "progress": 0,
        "owner": "me",
        "tags": ["rust", "learning", "programming", "tutorial"],
        "createdAt": "2025-07-10T03:08:11.202Z",
        "updatedAt": "2025-07-10T03:08:11.202Z",
        "taskCount": 20,
        "completedTaskCount": 0
      }
    ]
  }
}
```

## 2. Fetch Specific Project with All Tasks

```graphql
query GetProjectWithTasks($projectId: ID!) {
  project(id: $projectId) {
    id
    name
    description
    status
    progress
    owner
    tags
    startDate
    endDate
    createdAt
    updatedAt
    taskCount
    completedTaskCount
    tasks {
      id
      title
      description
      status
      priority
      assignee
      dueDate
      progress
      dependencies
      createdAt
      updatedAt
    }
  }
}
```

**Variables:**
```json
{
  "projectId": "0b3dfaf1-239"
}
```

**Expected Response:**
```json
{
  "data": {
    "project": {
      "id": "0b3dfaf1-239",
      "name": "learn_rust_with_ai",
      "description": "A comprehensive project to learn all of Rust's features by building practical applications...",
      "status": "PLANNING",
      "progress": 0,
      "owner": "me",
      "tags": ["rust", "learning", "programming", "tutorial"],
      "startDate": null,
      "endDate": null,
      "createdAt": "2025-07-10T03:08:11.202Z",
      "updatedAt": "2025-07-10T03:08:11.202Z",
      "taskCount": 20,
      "completedTaskCount": 0,
      "tasks": [
        {
          "id": "c8bd2ca6-be3",
          "title": "Setup & Hello World",
          "description": "Install Rust using rustup, create your first Cargo project...",
          "status": "NOT_STARTED",
          "priority": "CRITICAL",
          "assignee": null,
          "dueDate": null,
          "progress": 0,
          "dependencies": [],
          "createdAt": "2025-07-10T03:08:17.682Z",
          "updatedAt": "2025-07-10T03:08:17.682Z"
        },
        {
          "id": "dc67fd31-025",
          "title": "Variables & Data Types",
          "description": "Learn about variable mutability (let vs let mut)...",
          "status": "NOT_STARTED",
          "priority": "HIGH",
          "assignee": null,
          "dueDate": null,
          "progress": 0,
          "dependencies": [],
          "createdAt": "2025-07-10T03:08:23.345Z",
          "updatedAt": "2025-07-10T03:08:23.345Z"
        }
        // ... 18 more tasks
      ]
    }
  }
}
```

## 3. Fetch All Tasks (without project details)

```graphql
query GetAllTasks {
  tasks {
    id
    title
    description
    status
    priority
    assignee
    dueDate
    progress
    dependencies
    createdAt
    updatedAt
  }
}
```

## 4. Fetch Tasks by Priority

```graphql
query GetCriticalTasks {
  tasks(filters: { priority: CRITICAL }) {
    id
    title
    description
    status
    priority
    progress
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "tasks": [
      {
        "id": "c8bd2ca6-be3",
        "title": "Setup & Hello World",
        "description": "Install Rust using rustup, create your first Cargo project...",
        "status": "NOT_STARTED",
        "priority": "CRITICAL",
        "progress": 0
      },
      {
        "id": "9fc0e617-b24",
        "title": "Ownership Basics",
        "description": "Understand Rust's ownership system through simple examples...",
        "status": "NOT_STARTED",
        "priority": "CRITICAL",
        "progress": 0
      },
      {
        "id": "aa013130-5d1",
        "title": "References & Borrowing",
        "description": "Learn about references (&) and mutable references (&mut)...",
        "status": "NOT_STARTED",
        "priority": "CRITICAL",
        "progress": 0
      },
      {
        "id": "e24cf825-05b",
        "title": "Error Handling (Result & Option)",
        "description": "Master Result<T,E> and Option<T> types for error handling...",
        "status": "NOT_STARTED",
        "priority": "CRITICAL",
        "progress": 0
      }
    ]
  }
}
```

## 5. Search Projects by Tag

```graphql
query SearchRustProjects {
  searchProjects(query: "rust", fields: ["tags", "name"]) {
    id
    name
    description
    status
    tags
    owner
    progress
  }
}
```

## 6. Get Global Statistics

```graphql
query GetGlobalStats {
  globalStats {
    totalProjects
    totalTasks
    projectsByStatus {
      planning
      active
      onHold
      completed
      cancelled
    }
    tasksByStatus {
      notStarted
      inProgress
      completed
      blocked
    }
    tasksByPriority {
      low
      medium
      high
      critical
    }
    averageProjectProgress
    averageTaskProgress
    uniqueAssignees
    uniqueOwners
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "globalStats": {
      "totalProjects": 1,
      "totalTasks": 20,
      "projectsByStatus": {
        "planning": 1,
        "active": 0,
        "onHold": 0,
        "completed": 0,
        "cancelled": 0
      },
      "tasksByStatus": {
        "notStarted": 20,
        "inProgress": 0,
        "completed": 0,
        "blocked": 0
      },
      "tasksByPriority": {
        "low": 2,
        "medium": 6,
        "high": 8,
        "critical": 4
      },
      "averageProjectProgress": 0,
      "averageTaskProgress": 0,
      "uniqueAssignees": 0,
      "uniqueOwners": 1
    }
  }
}
```

## 7. Get Project-Specific Statistics

```graphql
query GetProjectStats($projectId: ID!) {
  projectStats(projectId: $projectId) {
    projectId
    projectName
    totalTasks
    tasksByStatus {
      notStarted
      inProgress
      completed
      blocked
    }
    tasksByPriority {
      low
      medium
      high
      critical
    }
    overallProgress
    averageTaskProgress
    tasksWithDependencies
  }
}
```

**Variables:**
```json
{
  "projectId": "0b3dfaf1-239"
}
```

## 8. Update Task Status (Mutation)

```graphql
mutation UpdateTaskStatus($taskId: ID!, $projectId: ID!, $status: TaskStatus!, $progress: Int) {
  updateTask(input: {
    id: $taskId
    projectId: $projectId
    status: $status
    progress: $progress
  }) {
    id
    title
    status
    progress
    updatedAt
  }
}
```

**Variables:**
```json
{
  "taskId": "c8bd2ca6-be3",
  "projectId": "0b3dfaf1-239",
  "status": "IN_PROGRESS",
  "progress": 25
}
```

## 9. Create New Task (Mutation)

```graphql
mutation CreateNewTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    id
    title
    description
    status
    priority
    assignee
    dueDate
    progress
    dependencies
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "projectId": "0b3dfaf1-239",
    "title": "Advanced Macros",
    "description": "Learn to write declarative and procedural macros in Rust",
    "status": "NOT_STARTED",
    "priority": "MEDIUM",
    "assignee": "me",
    "progress": 0,
    "dependencies": ["a9bc1de3-601"]
  }
}
```

## 10. Update Project Progress (Mutation)

```graphql
mutation UpdateProjectProgress($projectId: ID!) {
  updateProjectProgress(id: $projectId) {
    id
    name
    progress
    updatedAt
  }
}
```

**Variables:**
```json
{
  "projectId": "0b3dfaf1-239"
}
```

## 11. Complex Query with Nested Data

```graphql
query GetCompleteProjectView($projectId: ID!) {
  project(id: $projectId) {
    id
    name
    description
    status
    progress
    owner
    tags
    createdAt
    updatedAt
    taskCount
    completedTaskCount
    tasks {
      id
      title
      description
      status
      priority
      assignee
      dueDate
      progress
      dependencies
      createdAt
      updatedAt
    }
  }
  
  projectStats(projectId: $projectId) {
    totalTasks
    tasksByStatus {
      notStarted
      inProgress
      completed
      blocked
    }
    tasksByPriority {
      low
      medium
      high
      critical
    }
    overallProgress
    averageTaskProgress
  }
}
```

## ✅ WORKING GraphQL API

**Status**: All queries are now working successfully!

## How to Test These Queries

1. **Start the GraphQL server:**
   ```bash
   bun run graphql:dev
   ```

2. **Open GraphQL Playground:**
   ```
   http://localhost:4000/graphql
   ```

3. **Copy and paste any of the queries above**

4. **Add variables in the Variables panel (bottom left)**

5. **Click the Play button to execute**

## Verified Working Examples

### ✅ Basic Project List
```graphql
query GetAllProjects {
  projects {
    id
    name
    status
    progress
    owner
    tags
  }
}
```

### ✅ Detailed Project with Tasks
```graphql
query GetProjectWithTasks($projectId: ID!) {
  project(id: $projectId) {
    id
    name
    description
    status
    taskCount
    completedTaskCount
    tasks {
      id
      title
      status
      priority
      progress
    }
  }
}
```
Variables: `{"projectId": "0b3dfaf1-239"}`

### ✅ Global Statistics
```graphql
query GetGlobalStats {
  globalStats {
    totalProjects
    totalTasks
    tasksByPriority {
      low
      medium
      high
      critical
    }
  }
}
```

### ✅ Search Projects
```graphql
query SearchProjects($searchQuery: String!) {
  searchProjects(query: $searchQuery, fields: ["name", "description", "tags"]) {
    id
    name
    tags
    owner
  }
}
```
Variables: `{"searchQuery": "rust"}`

## Test Results from Database Snapshot

- **Total Projects**: 1 (Rust learning project)
- **Total Tasks**: 20 (comprehensive Rust curriculum)
- **Task Priority Distribution**: 
  - Critical: 4 tasks
  - High: 8 tasks  
  - Medium: 6 tasks
  - Low: 2 tasks
- **All tasks**: Currently "NOT_STARTED" status
- **Project Status**: "PLANNING" phase

## Note on Data Types

- **Project Status**: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`
- **Task Status**: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`
- **Task Priority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **DateTime**: ISO 8601 format strings
- **IDs**: String format (12-character UUIDs in this case)