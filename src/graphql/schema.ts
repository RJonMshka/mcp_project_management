import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  # Scalar types
  scalar DateTime

  # Enums
  enum ProjectStatus {
    PLANNING
    ACTIVE
    ON_HOLD
    COMPLETED
    CANCELLED
  }

  enum TaskStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    BLOCKED
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  # Input types
  input CreateProjectInput {
    name: String!
    description: String!
    status: ProjectStatus
    startDate: DateTime
    endDate: DateTime
    owner: String
    tags: [String!]
  }

  input UpdateProjectInput {
    id: ID!
    name: String
    description: String
    status: ProjectStatus
    startDate: DateTime
    endDate: DateTime
    owner: String
    tags: [String!]
  }

  input CreateTaskInput {
    projectId: ID!
    title: String!
    description: String!
    status: TaskStatus
    priority: TaskPriority
    assignee: String
    dueDate: DateTime
    progress: Int
    dependencies: [ID!]
  }

  input UpdateTaskInput {
    id: ID!
    projectId: ID!
    title: String
    description: String
    status: TaskStatus
    priority: TaskPriority
    assignee: String
    dueDate: DateTime
    progress: Int
    dependencies: [ID!]
  }

  input ProjectFiltersInput {
    status: ProjectStatus
    owner: String
    tags: [String!]
  }

  input TaskFiltersInput {
    projectId: ID
    status: TaskStatus
    priority: TaskPriority
    assignee: String
  }

  # Types
  type Project {
    id: ID!
    name: String!
    description: String!
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    progress: Int!
    owner: String
    tags: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    tasks: [Task!]!
    taskCount: Int!
    completedTaskCount: Int!
  }

  type Task {
    id: ID!
    projectId: ID!
    title: String!
    description: String!
    status: TaskStatus!
    priority: TaskPriority!
    assignee: String
    dueDate: DateTime
    progress: Int!
    dependencies: [ID!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    project: Project!
  }

  type ProjectStats {
    totalProjects: Int!
    totalTasks: Int!
    projectsByStatus: ProjectStatusStats!
    tasksByStatus: TaskStatusStats!
    tasksByPriority: TaskPriorityStats!
    averageProjectProgress: Float!
    averageTaskProgress: Float!
    uniqueAssignees: Int!
    uniqueOwners: Int!
  }

  type ProjectStatusStats {
    planning: Int!
    active: Int!
    onHold: Int!
    completed: Int!
    cancelled: Int!
  }

  type TaskStatusStats {
    notStarted: Int!
    inProgress: Int!
    completed: Int!
    blocked: Int!
  }

  type TaskPriorityStats {
    low: Int!
    medium: Int!
    high: Int!
    critical: Int!
  }

  type ProjectSpecificStats {
    projectId: ID!
    projectName: String!
    totalTasks: Int!
    tasksByStatus: TaskStatusStats!
    tasksByPriority: TaskPriorityStats!
    overallProgress: Int!
    averageTaskProgress: Float!
    tasksWithDependencies: Int!
  }

  # Queries
  type Query {
    # Project queries
    projects(filters: ProjectFiltersInput): [Project!]!
    project(id: ID!): Project
    searchProjects(query: String!, fields: [String!]): [Project!]!
    
    # Task queries
    tasks(filters: TaskFiltersInput): [Task!]!
    task(id: ID!, projectId: ID!): Task
    searchTasks(query: String!, projectId: ID, fields: [String!]): [Task!]!
    
    # Statistics queries
    globalStats: ProjectStats!
    projectStats(projectId: ID!): ProjectSpecificStats!
  }

  # Mutations
  type Mutation {
    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    updateProjectProgress(id: ID!): Project!
    
    # Task mutations
    createTask(input: CreateTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
    deleteTask(id: ID!, projectId: ID!): Boolean!
  }

  # Subscriptions (for real-time updates)
  type Subscription {
    projectUpdated: Project!
    taskUpdated: Task!
    projectCreated: Project!
    taskCreated: Task!
  }
`);