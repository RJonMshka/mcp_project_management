#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'pg';

// Types for our project management system
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  dependencies?: string[]; // task IDs
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  progress: number; // 0-100
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  owner?: string;
  tags?: string[];
}

interface ProjectData {
  projects: Project[];
  lastModified: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class ProjectMCPServer {
  private server: Server;
  private dbConfig: DatabaseConfig;

  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'project_management',
      user: process.env.DB_USER || 'mcp_user',
      password: process.env.DB_PASSWORD || 'mcp_password',
    };
    
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

  private async getDbClient(): Promise<Client> {
    const client = new Client(this.dbConfig);
    await client.connect();
    return client;
  }

  private async getAllProjects(): Promise<Project[]> {
    const client = await this.getDbClient();
    try {
      const projectsResult = await client.query('SELECT * FROM projects ORDER BY updated_at DESC');
      const projects: Project[] = [];
      
      for (const row of projectsResult.rows) {
        const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [row.id]);
        const tasks: Task[] = tasksResult.rows.map(taskRow => ({
          id: taskRow.id,
          title: taskRow.title,
          description: taskRow.description,
          status: taskRow.status,
          priority: taskRow.priority,
          assignee: taskRow.assignee,
          dueDate: taskRow.due_date?.toISOString(),
          progress: taskRow.progress,
          createdAt: taskRow.created_at.toISOString(),
          updatedAt: taskRow.updated_at.toISOString(),
          dependencies: taskRow.dependencies || [],
        }));
        
        projects.push({
          id: row.id,
          name: row.name,
          description: row.description,
          status: row.status,
          startDate: row.start_date?.toISOString(),
          endDate: row.end_date?.toISOString(),
          progress: row.progress,
          tasks,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          owner: row.owner,
          tags: row.tags || [],
        });
      }
      
      return projects;
    } finally {
      await client.end();
    }
  }

  private async getProjectById(projectId: string): Promise<Project | null> {
    const client = await this.getDbClient();
    try {
      const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (projectResult.rows.length === 0) return null;
      
      const row = projectResult.rows[0];
      const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [row.id]);
      const tasks: Task[] = tasksResult.rows.map(taskRow => ({
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description,
        status: taskRow.status,
        priority: taskRow.priority,
        assignee: taskRow.assignee,
        dueDate: taskRow.due_date?.toISOString(),
        progress: taskRow.progress,
        createdAt: taskRow.created_at.toISOString(),
        updatedAt: taskRow.updated_at.toISOString(),
        dependencies: taskRow.dependencies || [],
      }));
      
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        startDate: row.start_date?.toISOString(),
        endDate: row.end_date?.toISOString(),
        progress: row.progress,
        tasks,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        owner: row.owner,
        tags: row.tags || [],
      };
    } finally {
      await client.end();
    }
  }

  private generateId(): string {
    return crypto.randomUUID().substring(0, 12);
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
    let projects = await this.getAllProjects();

    if (args.status) {
      projects = projects.filter(p => p.status === args.status);
    }

    const projectSummaries = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: p.progress,
      taskCount: p.tasks.length,
      completedTasks: p.tasks.filter(t => t.status === 'completed').length,
      owner: p.owner,
      startDate: p.startDate,
      endDate: p.endDate,
      updatedAt: p.updatedAt,
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
    const project = await this.getProjectById(args.projectId);

    if (!project) {
      throw new Error(`Project with ID ${args.projectId} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  }

  private async createProject(args: any) {
    const client = await this.getDbClient();
    try {
      const id = this.generateId();
      const startDate = args.startDate ? new Date(args.startDate) : null;
      const endDate = args.endDate ? new Date(args.endDate) : null;
      
      await client.query(
        `INSERT INTO projects (id, name, description, status, start_date, end_date, progress, owner, tags) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, args.name, args.description, args.status || 'planning', startDate, endDate, 0, args.owner, args.tags || []]
      );

      return {
        content: [
          {
            type: 'text',
            text: `Project "${args.name}" created successfully with ID: ${id}`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async updateProject(args: any) {
    const client = await this.getDbClient();
    try {
      const existingProject = await client.query('SELECT * FROM projects WHERE id = $1', [args.projectId]);
      if (existingProject.rows.length === 0) {
        throw new Error(`Project with ID ${args.projectId} not found`);
      }
      
      const project = existingProject.rows[0];
      const startDate = args.startDate !== undefined ? (args.startDate ? new Date(args.startDate) : null) : project.start_date;
      const endDate = args.endDate !== undefined ? (args.endDate ? new Date(args.endDate) : null) : project.end_date;
      
      await client.query(
        `UPDATE projects SET name = $1, description = $2, status = $3, start_date = $4, end_date = $5, owner = $6, tags = $7 
         WHERE id = $8`,
        [
          args.name || project.name,
          args.description || project.description,
          args.status || project.status,
          startDate,
          endDate,
          args.owner !== undefined ? args.owner : project.owner,
          args.tags || project.tags,
          args.projectId
        ]
      );

      return {
        content: [
          {
            type: 'text',
            text: `Project "${args.name || project.name}" updated successfully`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async deleteProject(args: any) {
    const client = await this.getDbClient();
    try {
      const existingProject = await client.query('SELECT * FROM projects WHERE id = $1', [args.projectId]);
      if (existingProject.rows.length === 0) {
        throw new Error(`Project with ID ${args.projectId} not found`);
      }
      
      const project = existingProject.rows[0];
      const tasksCount = await client.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [args.projectId]);
      
      await client.query('DELETE FROM projects WHERE id = $1', [args.projectId]);

      return {
        content: [
          {
            type: 'text',
            text: `Project "${project.name}" and all ${tasksCount.rows[0].count} tasks deleted successfully`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async listTasks(args: any) {
    const client = await this.getDbClient();
    try {
      let query = `
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (args.projectId) {
        conditions.push('t.project_id = $' + (params.length + 1));
        params.push(args.projectId);
      }

      if (args.status) {
        conditions.push('t.status = $' + (params.length + 1));
        params.push(args.status);
      }

      if (args.assignee) {
        conditions.push('t.assignee = $' + (params.length + 1));
        params.push(args.assignee);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY t.created_at';

      const result = await client.query(query, params);
      const tasks = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignee: row.assignee,
        dueDate: row.due_date?.toISOString(),
        progress: row.progress,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        dependencies: row.dependencies || [],
        projectId: row.project_id,
        projectName: row.project_name,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async getTask(args: any) {
    const client = await this.getDbClient();
    try {
      const result = await client.query(`
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id 
        WHERE t.id = $1 AND t.project_id = $2
      `, [args.taskId, args.projectId]);

      if (result.rows.length === 0) {
        throw new Error(`Task with ID ${args.taskId} not found in project ${args.projectId}`);
      }

      const row = result.rows[0];
      const task = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignee: row.assignee,
        dueDate: row.due_date?.toISOString(),
        progress: row.progress,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        dependencies: row.dependencies || [],
        projectId: row.project_id,
        projectName: row.project_name,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async createTask(args: any) {
    const client = await this.getDbClient();
    try {
      const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [args.projectId]);
      if (projectCheck.rows.length === 0) {
        throw new Error(`Project with ID ${args.projectId} not found`);
      }

      const id = this.generateId();
      const dueDate = args.dueDate ? new Date(args.dueDate) : null;
      
      await client.query(`
        INSERT INTO tasks (id, project_id, title, description, status, priority, assignee, due_date, progress, dependencies) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        id,
        args.projectId,
        args.title,
        args.description,
        args.status || 'not_started',
        args.priority || 'medium',
        args.assignee,
        dueDate,
        args.progress || 0,
        args.dependencies || []
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `Task "${args.title}" created successfully with ID: ${id}`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async updateTask(args: any) {
    const client = await this.getDbClient();
    try {
      const existingTask = await client.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [args.taskId, args.projectId]);
      if (existingTask.rows.length === 0) {
        throw new Error(`Task with ID ${args.taskId} not found in project ${args.projectId}`);
      }
      
      const task = existingTask.rows[0];
      const dueDate = args.dueDate !== undefined ? (args.dueDate ? new Date(args.dueDate) : null) : task.due_date;
      
      await client.query(`
        UPDATE tasks SET 
          title = $1, 
          description = $2, 
          status = $3, 
          priority = $4, 
          assignee = $5, 
          due_date = $6, 
          progress = $7, 
          dependencies = $8 
        WHERE id = $9 AND project_id = $10
      `, [
        args.title || task.title,
        args.description || task.description,
        args.status || task.status,
        args.priority || task.priority,
        args.assignee !== undefined ? args.assignee : task.assignee,
        dueDate,
        args.progress !== undefined ? args.progress : task.progress,
        args.dependencies || task.dependencies,
        args.taskId,
        args.projectId
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `Task "${args.title || task.title}" updated successfully`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async deleteTask(args: any) {
    const client = await this.getDbClient();
    try {
      const existingTask = await client.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [args.taskId, args.projectId]);
      if (existingTask.rows.length === 0) {
        throw new Error(`Task with ID ${args.taskId} not found in project ${args.projectId}`);
      }
      
      const task = existingTask.rows[0];
      await client.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [args.taskId, args.projectId]);

      return {
        content: [
          {
            type: 'text',
            text: `Task "${task.title}" deleted successfully`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async updateProjectProgress(args: any) {
    const client = await this.getDbClient();
    try {
      const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [args.projectId]);
      if (projectResult.rows.length === 0) {
        throw new Error(`Project with ID ${args.projectId} not found`);
      }
      
      const project = projectResult.rows[0];
      const tasksResult = await client.query('SELECT progress FROM tasks WHERE project_id = $1', [args.projectId]);
      
      let progress = 0;
      if (tasksResult.rows.length > 0) {
        const totalProgress = tasksResult.rows.reduce((sum, task) => sum + task.progress, 0);
        progress = Math.round(totalProgress / tasksResult.rows.length);
      }
      
      await client.query('UPDATE projects SET progress = $1 WHERE id = $2', [progress, args.projectId]);

      return {
        content: [
          {
            type: 'text',
            text: `Project "${project.name}" progress updated to ${progress}%`,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async searchProjects(args: any) {
    const client = await this.getDbClient();
    try {
      const query = args.query.toLowerCase();
      const searchFields = args.searchFields || ['name', 'description', 'tags'];
      
      const conditions: string[] = [];
      
      if (searchFields.includes('name')) {
        conditions.push('LOWER(name) LIKE $1');
      }
      if (searchFields.includes('description')) {
        conditions.push('LOWER(description) LIKE $1');
      }
      if (searchFields.includes('tags')) {
        conditions.push('EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)');
      }
      
      const searchQuery = `
        SELECT * FROM projects 
        WHERE ${conditions.join(' OR ')} 
        ORDER BY updated_at DESC
      `;
      
      const result = await client.query(searchQuery, [`%${query}%`]);
      const projects = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        startDate: row.start_date?.toISOString(),
        endDate: row.end_date?.toISOString(),
        progress: row.progress,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        owner: row.owner,
        tags: row.tags || [],
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async searchTasks(args: any) {
    const client = await this.getDbClient();
    try {
      const query = args.query.toLowerCase();
      const searchFields = args.searchFields || ['title', 'description'];
      
      const conditions: string[] = [];
      const params: any[] = [`%${query}%`];
      
      if (searchFields.includes('title')) {
        conditions.push('LOWER(t.title) LIKE $1');
      }
      if (searchFields.includes('description')) {
        conditions.push('LOWER(t.description) LIKE $1');
      }
      if (searchFields.includes('assignee')) {
        conditions.push('LOWER(t.assignee) LIKE $1');
      }
      
      let searchQuery = `
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id 
        WHERE ${conditions.join(' OR ')}
      `;
      
      if (args.projectId) {
        searchQuery += ' AND t.project_id = $2';
        params.push(args.projectId);
      }
      
      searchQuery += ' ORDER BY t.created_at';
      
      const result = await client.query(searchQuery, params);
      const tasks = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignee: row.assignee,
        dueDate: row.due_date?.toISOString(),
        progress: row.progress,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        dependencies: row.dependencies || [],
        projectId: row.project_id,
        projectName: row.project_name,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async getProjectStats(args: any) {
    const client = await this.getDbClient();
    try {
      if (args.projectId) {
        // Stats for specific project
        const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [args.projectId]);
        if (projectResult.rows.length === 0) {
          throw new Error(`Project with ID ${args.projectId} not found`);
        }
        
        const project = projectResult.rows[0];
        const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1', [args.projectId]);
        const tasks = tasksResult.rows;
        
        const stats = {
          projectId: project.id,
          projectName: project.name,
          totalTasks: tasks.length,
          tasksByStatus: {
            not_started: tasks.filter(t => t.status === 'not_started').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            blocked: tasks.filter(t => t.status === 'blocked').length,
          },
          tasksByPriority: {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            critical: tasks.filter(t => t.priority === 'critical').length,
          },
          overallProgress: project.progress,
          averageTaskProgress: tasks.length > 0 
            ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
            : 0,
          tasksWithDependencies: tasks.filter(t => t.dependencies && t.dependencies.length > 0).length,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      } else {
        // Global stats
        const projectsResult = await client.query('SELECT * FROM projects');
        const tasksResult = await client.query('SELECT * FROM tasks');
        const projects = projectsResult.rows;
        const allTasks = tasksResult.rows;
        
        const stats = {
          totalProjects: projects.length,
          totalTasks: allTasks.length,
          projectsByStatus: {
            planning: projects.filter(p => p.status === 'planning').length,
            active: projects.filter(p => p.status === 'active').length,
            on_hold: projects.filter(p => p.status === 'on_hold').length,
            completed: projects.filter(p => p.status === 'completed').length,
            cancelled: projects.filter(p => p.status === 'cancelled').length,
          },
          tasksByStatus: {
            not_started: allTasks.filter(t => t.status === 'not_started').length,
            in_progress: allTasks.filter(t => t.status === 'in_progress').length,
            completed: allTasks.filter(t => t.status === 'completed').length,
            blocked: allTasks.filter(t => t.status === 'blocked').length,
          },
          averageProjectProgress: projects.length > 0
            ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
            : 0,
          averageTaskProgress: allTasks.length > 0
            ? Math.round(allTasks.reduce((sum, task) => sum + task.progress, 0) / allTasks.length)
            : 0,
          tasksWithDependencies: allTasks.filter(t => t.dependencies && t.dependencies.length > 0).length,
          uniqueAssignees: [...new Set(allTasks.filter(t => t.assignee).map(t => t.assignee))].length,
          uniqueOwners: [...new Set(projects.filter(p => p.owner).map(p => p.owner))].length,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }
    } finally {
      await client.end();
    }
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