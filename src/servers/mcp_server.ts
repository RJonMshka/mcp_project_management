#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseService } from '../shared/database-service.js';

// Helper functions to convert between shared types and MCP response format
function formatProjectForMCP(project: any): any {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
    progress: project.progress,
    owner: project.owner,
    tags: project.tags,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: project.tasks ? project.tasks.map(formatTaskForMCP) : [],
  };
}

function formatTaskForMCP(task: any): any {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    dueDate: task.dueDate?.toISOString(),
    progress: task.progress,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dependencies: task.dependencies || [],
  };
}

class ProjectMCPServer {
  private server: Server;
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
    
    this.server = new Server(
      {
        name: 'project-management-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_projects',
            description: 'List all projects with their basic information',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
                  description: 'Filter projects by status (optional)',
                },
              },
            },
          },
          {
            name: 'get_project',
            description: 'Get detailed information about a specific project including all tasks',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'The ID of the project to retrieve',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'create_project',
            description: 'Create a new project',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Project name' },
                description: { type: 'string', description: 'Project description' },
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
                  default: 'planning',
                },
                startDate: { type: 'string', description: 'Start date (ISO format)' },
                endDate: { type: 'string', description: 'End date (ISO format)' },
                owner: { type: 'string', description: 'Project owner' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Project tags',
                },
              },
              required: ['name', 'description'],
            },
          },
          {
            name: 'update_project',
            description: 'Update an existing project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID to update' },
                name: { type: 'string', description: 'Project name' },
                description: { type: 'string', description: 'Project description' },
                status: {
                  type: 'string',
                  enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
                },
                startDate: { type: 'string', description: 'Start date (ISO format)' },
                endDate: { type: 'string', description: 'End date (ISO format)' },
                owner: { type: 'string', description: 'Project owner' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Project tags',
                },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'delete_project',
            description: 'Delete a project and all its tasks',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID to delete' },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'list_tasks',
            description: 'List tasks from a specific project or all projects',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Project ID to filter tasks (optional - if not provided, lists all tasks)',
                },
                status: {
                  type: 'string',
                  enum: ['not_started', 'in_progress', 'completed', 'blocked'],
                  description: 'Filter tasks by status (optional)',
                },
                assignee: {
                  type: 'string',
                  description: 'Filter tasks by assignee (optional)',
                },
              },
            },
          },
          {
            name: 'get_task',
            description: 'Get detailed information about a specific task',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID containing the task' },
                taskId: { type: 'string', description: 'Task ID to retrieve' },
              },
              required: ['projectId', 'taskId'],
            },
          },
          {
            name: 'create_task',
            description: 'Create a new task in a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID to add task to' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                status: {
                  type: 'string',
                  enum: ['not_started', 'in_progress', 'completed', 'blocked'],
                  default: 'not_started',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  default: 'medium',
                },
                assignee: { type: 'string', description: 'Task assignee' },
                dueDate: { type: 'string', description: 'Due date (ISO format)' },
                progress: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  default: 0,
                  description: 'Task progress percentage',
                },
                dependencies: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of task IDs this task depends on',
                },
              },
              required: ['projectId', 'title', 'description'],
            },
          },
          {
            name: 'update_task',
            description: 'Update an existing task',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID containing the task' },
                taskId: { type: 'string', description: 'Task ID to update' },
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                status: {
                  type: 'string',
                  enum: ['not_started', 'in_progress', 'completed', 'blocked'],
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                assignee: { type: 'string', description: 'Task assignee' },
                dueDate: { type: 'string', description: 'Due date (ISO format)' },
                progress: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Task progress percentage',
                },
                dependencies: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of task IDs this task depends on',
                },
              },
              required: ['projectId', 'taskId'],
            },
          },
          {
            name: 'delete_task',
            description: 'Delete a task from a project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID containing the task' },
                taskId: { type: 'string', description: 'Task ID to delete' },
              },
              required: ['projectId', 'taskId'],
            },
          },
          {
            name: 'update_project_progress',
            description: 'Automatically calculate and update project progress based on task completion',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID to update progress for' },
              },
              required: ['projectId'],
            },
          },
          {
            name: 'search_projects',
            description: 'Search projects by name, description, or tags',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                searchFields: {
                  type: 'array',
                  items: { type: 'string', enum: ['name', 'description', 'tags'] },
                  default: ['name', 'description', 'tags'],
                  description: 'Fields to search in',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'search_tasks',
            description: 'Search tasks by title, description, or assignee',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                projectId: { type: 'string', description: 'Limit search to specific project (optional)' },
                searchFields: {
                  type: 'array',
                  items: { type: 'string', enum: ['title', 'description', 'assignee'] },
                  default: ['title', 'description'],
                  description: 'Fields to search in',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_project_stats',
            description: 'Get statistics for a project or all projects',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: { type: 'string', description: 'Project ID for specific stats (optional - if not provided, gets global stats)' },
              },
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_projects':
            return await this.listProjects(args);
          case 'get_project':
            return await this.getProject(args);
          case 'create_project':
            return await this.createProject(args);
          case 'update_project':
            return await this.updateProject(args);
          case 'delete_project':
            return await this.deleteProject(args);
          case 'list_tasks':
            return await this.listTasks(args);
          case 'get_task':
            return await this.getTask(args);
          case 'create_task':
            return await this.createTask(args);
          case 'update_task':
            return await this.updateTask(args);
          case 'delete_task':
            return await this.deleteTask(args);
          case 'update_project_progress':
            return await this.updateProjectProgress(args);
          case 'search_projects':
            return await this.searchProjects(args);
          case 'search_tasks':
            return await this.searchTasks(args);
          case 'get_project_stats':
            return await this.getProjectStats(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async listProjects(args: any) {
    const projects = await this.dbService.getProjectsOnly(args.status ? { status: args.status } : undefined);

    const projectSummaries = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: p.progress,
      owner: p.owner,
      startDate: p.startDate?.toISOString(),
      endDate: p.endDate?.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      tags: p.tags,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projectSummaries, null, 2),
        },
      ],
    };
  }

  private async getProject(args: any) {
    const project = await this.dbService.getProjectById(args.projectId);

    if (!project) {
      throw new Error(`Project with ID ${args.projectId} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formatProjectForMCP(project), null, 2),
        },
      ],
    };
  }

  private async createProject(args: any) {
    const project = await this.dbService.createProject({
      name: args.name,
      description: args.description,
      status: args.status,
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      owner: args.owner,
      tags: args.tags,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Project "${args.name}" created successfully with ID: ${project.id}`,
        },
      ],
    };
  }

  private async updateProject(args: any) {
    const project = await this.dbService.updateProject({
      id: args.projectId,
      name: args.name,
      description: args.description,
      status: args.status,
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      owner: args.owner,
      tags: args.tags,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Project "${project.name}" updated successfully`,
        },
      ],
    };
  }

  private async deleteProject(args: any) {
    const result = await this.dbService.deleteProject(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Project "${result.name}" and all ${result.taskCount} tasks deleted successfully`,
        },
      ],
    };
  }

  private async listTasks(args: any) {
    const tasks = await this.dbService.getAllTasks({
      projectId: args.projectId,
      status: args.status,
      assignee: args.assignee,
    });

    const formattedTasks = tasks.map(formatTaskForMCP);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedTasks, null, 2),
        },
      ],
    };
  }

  private async getTask(args: any) {
    const task = await this.dbService.getTaskById(args.taskId, args.projectId);

    if (!task) {
      throw new Error(`Task with ID ${args.taskId} not found in project ${args.projectId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formatTaskForMCP(task), null, 2),
        },
      ],
    };
  }

  private async createTask(args: any) {
    const task = await this.dbService.createTask({
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assignee: args.assignee,
      dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      progress: args.progress,
      dependencies: args.dependencies,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Task "${args.title}" created successfully with ID: ${task.id}`,
        },
      ],
    };
  }

  private async updateTask(args: any) {
    const task = await this.dbService.updateTask({
      id: args.taskId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      assignee: args.assignee,
      dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      progress: args.progress,
      dependencies: args.dependencies,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Task "${task.title}" updated successfully`,
        },
      ],
    };
  }

  private async deleteTask(args: any) {
    const result = await this.dbService.deleteTask(args.taskId, args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Task "${result.title}" deleted successfully`,
        },
      ],
    };
  }

  private async updateProjectProgress(args: any) {
    const project = await this.dbService.updateProjectProgress(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: `Project "${project.name}" progress updated to ${project.progress}%`,
        },
      ],
    };
  }

  private async searchProjects(args: any) {
    const projects = await this.dbService.searchProjects(args.query, args.searchFields);

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate?.toISOString(),
      endDate: p.endDate?.toISOString(),
      progress: p.progress,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      owner: p.owner,
      tags: p.tags,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedProjects, null, 2),
        },
      ],
    };
  }

  private async searchTasks(args: any) {
    const tasks = await this.dbService.searchTasks(args.query, args.projectId, args.searchFields);

    const formattedTasks = tasks.map(formatTaskForMCP);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedTasks, null, 2),
        },
      ],
    };
  }

  private async getProjectStats(args: any) {
    const stats = args.projectId 
      ? await this.dbService.getProjectStats(args.projectId)
      : await this.dbService.getGlobalStats();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Project Management MCP server running on stdio with Bun');
  }
}

// Export the class for testing
export { ProjectMCPServer };

// Start the server only if this file is run directly
if (import.meta.main) {
  const server = new ProjectMCPServer();
  server.run().catch(console.error);
}