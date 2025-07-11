#!/usr/bin/env bun

import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '../graphql/resolvers.js';

const PORT = process.env.GRAPHQL_PORT || 4000;
const HOST = process.env.GRAPHQL_HOST || 'localhost';

// Define the schema as a string (typeDefs)
const typeDefs = `
  scalar DateTime

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

  type Query {
    projects(filters: ProjectFiltersInput): [Project!]!
    project(id: ID!): Project
    searchProjects(query: String!, fields: [String!]): [Project!]!
    tasks(filters: TaskFiltersInput): [Task!]!
    task(id: ID!, projectId: ID!): Task
    searchTasks(query: String!, projectId: ID, fields: [String!]): [Task!]!
    globalStats: ProjectStats!
    projectStats(projectId: ID!): ProjectSpecificStats!
  }

  type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    updateProjectProgress(id: ID!): Project!
    createTask(input: CreateTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
    deleteTask(id: ID!, projectId: ID!): Boolean!
  }

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
`;

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  graphiql: {
    title: 'Project Management GraphQL API',
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com', 'https://your-mobile-app.com']
      : '*',
    credentials: process.env.NODE_ENV === 'production',
  },
  context: ({ request }) => ({
    request,
  }),
});

// Create Bun server
const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  fetch: yoga.fetch,
});

console.log(`🚀 GraphQL Server ready at http://${HOST}:${PORT}/graphql`);
console.log(`📊 GraphQL Playground available at http://${HOST}:${PORT}/graphql`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.stop();
  process.exit(0);
});

export default server;