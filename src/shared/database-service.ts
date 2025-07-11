import { Client } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  progress: number;
  owner?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  progress: number;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export class DatabaseService {
  private dbConfig: DatabaseConfig;

  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'project_management',
      user: process.env.DB_USER || 'mcp_user',
      password: process.env.DB_PASSWORD || 'mcp_password',
    };
  }

  private async getClient(): Promise<Client> {
    const client = new Client(this.dbConfig);
    await client.connect();
    return client;
  }

  private generateId(): string {
    return crypto.randomUUID().substring(0, 12);
  }

  // Project CRUD operations
  async getAllProjects(): Promise<ProjectWithTasks[]> {
    const client = await this.getClient();
    try {
      const projectsResult = await client.query('SELECT * FROM projects ORDER BY updated_at DESC');
      const projects: ProjectWithTasks[] = [];
      
      for (const row of projectsResult.rows) {
        const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [row.id]);
        const tasks: Task[] = tasksResult.rows.map(this.mapTaskRow);
        
        projects.push({
          ...this.mapProjectRow(row),
          tasks,
        });
      }
      
      return projects;
    } finally {
      await client.end();
    }
  }

  async getProjectById(projectId: string): Promise<ProjectWithTasks | null> {
    const client = await this.getClient();
    try {
      const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (projectResult.rows.length === 0) return null;
      
      const row = projectResult.rows[0];
      const tasksResult = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [row.id]);
      const tasks: Task[] = tasksResult.rows.map(this.mapTaskRow);
      
      return {
        ...this.mapProjectRow(row),
        tasks,
      };
    } finally {
      await client.end();
    }
  }

  async getProjectsOnly(filters?: { status?: string; owner?: string; tags?: string[] }): Promise<Project[]> {
    const client = await this.getClient();
    try {
      let query = 'SELECT * FROM projects';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters?.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
      }

      if (filters?.owner) {
        conditions.push(`owner = $${params.length + 1}`);
        params.push(filters.owner);
      }

      if (filters?.tags && filters.tags.length > 0) {
        conditions.push(`tags && $${params.length + 1}`);
        params.push(filters.tags);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY updated_at DESC';

      const result = await client.query(query, params);
      return result.rows.map(this.mapProjectRow);
    } finally {
      await client.end();
    }
  }

  async createProject(input: {
    name: string;
    description: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    owner?: string;
    tags?: string[];
  }): Promise<Project> {
    const client = await this.getClient();
    try {
      const id = this.generateId();
      const result = await client.query(
        `INSERT INTO projects (id, name, description, status, start_date, end_date, progress, owner, tags) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          id,
          input.name,
          input.description,
          input.status || 'planning',
          input.startDate || null,
          input.endDate || null,
          0,
          input.owner || null,
          input.tags || []
        ]
      );
      return this.mapProjectRow(result.rows[0]);
    } finally {
      await client.end();
    }
  }

  async updateProject(input: {
    id: string;
    name?: string;
    description?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    owner?: string;
    tags?: string[];
  }): Promise<Project> {
    const client = await this.getClient();
    try {
      const existingProject = await client.query('SELECT * FROM projects WHERE id = $1', [input.id]);
      if (existingProject.rows.length === 0) {
        throw new Error(`Project with ID ${input.id} not found`);
      }

      const project = existingProject.rows[0];
      const result = await client.query(
        `UPDATE projects SET 
         name = $1, description = $2, status = $3, start_date = $4, end_date = $5, owner = $6, tags = $7 
         WHERE id = $8 RETURNING *`,
        [
          input.name || project.name,
          input.description || project.description,
          input.status || project.status,
          input.startDate !== undefined ? input.startDate : project.start_date,
          input.endDate !== undefined ? input.endDate : project.end_date,
          input.owner !== undefined ? input.owner : project.owner,
          input.tags || project.tags,
          input.id
        ]
      );
      return this.mapProjectRow(result.rows[0]);
    } finally {
      await client.end();
    }
  }

  async deleteProject(id: string): Promise<{ success: boolean; name: string; taskCount: number }> {
    const client = await this.getClient();
    try {
      const existingProject = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
      if (existingProject.rows.length === 0) {
        throw new Error(`Project with ID ${id} not found`);
      }
      
      const project = existingProject.rows[0];
      const tasksCount = await client.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [id]);
      
      await client.query('DELETE FROM projects WHERE id = $1', [id]);

      return {
        success: true,
        name: project.name,
        taskCount: parseInt(tasksCount.rows[0].count)
      };
    } finally {
      await client.end();
    }
  }

  async searchProjects(query: string, fields: string[] = ['name', 'description', 'tags']): Promise<Project[]> {
    const client = await this.getClient();
    try {
      const searchQuery = query.toLowerCase();
      const conditions: string[] = [];

      if (fields.includes('name')) {
        conditions.push('LOWER(name) LIKE $1');
      }
      if (fields.includes('description')) {
        conditions.push('LOWER(description) LIKE $1');
      }
      if (fields.includes('tags')) {
        conditions.push('EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)');
      }

      const sql = `
        SELECT * FROM projects 
        WHERE ${conditions.join(' OR ')} 
        ORDER BY updated_at DESC
      `;

      const result = await client.query(sql, [`%${searchQuery}%`]);
      return result.rows.map(this.mapProjectRow);
    } finally {
      await client.end();
    }
  }

  // Task CRUD operations
  async getAllTasks(filters?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assignee?: string;
  }): Promise<Task[]> {
    const client = await this.getClient();
    try {
      let query = 'SELECT * FROM tasks';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters?.projectId) {
        conditions.push(`project_id = $${params.length + 1}`);
        params.push(filters.projectId);
      }

      if (filters?.status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
      }

      if (filters?.priority) {
        conditions.push(`priority = $${params.length + 1}`);
        params.push(filters.priority);
      }

      if (filters?.assignee) {
        conditions.push(`assignee = $${params.length + 1}`);
        params.push(filters.assignee);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY created_at';

      const result = await client.query(query, params);
      return result.rows.map(this.mapTaskRow);
    } finally {
      await client.end();
    }
  }

  async getTaskById(id: string, projectId: string): Promise<Task | null> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [id, projectId]);
      return result.rows.length > 0 ? this.mapTaskRow(result.rows[0]) : null;
    } finally {
      await client.end();
    }
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    const client = await this.getClient();
    try {
      const result = await client.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at', [projectId]);
      return result.rows.map(this.mapTaskRow);
    } finally {
      await client.end();
    }
  }

  async createTask(input: {
    projectId: string;
    title: string;
    description: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: Date;
    progress?: number;
    dependencies?: string[];
  }): Promise<Task> {
    const client = await this.getClient();
    try {
      const projectCheck = await client.query('SELECT id FROM projects WHERE id = $1', [input.projectId]);
      if (projectCheck.rows.length === 0) {
        throw new Error(`Project with ID ${input.projectId} not found`);
      }

      const id = this.generateId();
      const result = await client.query(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee, due_date, progress, dependencies) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          id,
          input.projectId,
          input.title,
          input.description,
          input.status || 'not_started',
          input.priority || 'medium',
          input.assignee || null,
          input.dueDate || null,
          input.progress || 0,
          input.dependencies || []
        ]
      );
      return this.mapTaskRow(result.rows[0]);
    } finally {
      await client.end();
    }
  }

  async updateTask(input: {
    id: string;
    projectId: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    dueDate?: Date;
    progress?: number;
    dependencies?: string[];
  }): Promise<Task> {
    const client = await this.getClient();
    try {
      const existingTask = await client.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [input.id, input.projectId]);
      if (existingTask.rows.length === 0) {
        throw new Error(`Task with ID ${input.id} not found in project ${input.projectId}`);
      }

      const task = existingTask.rows[0];
      const result = await client.query(
        `UPDATE tasks SET 
         title = $1, description = $2, status = $3, priority = $4, assignee = $5, due_date = $6, progress = $7, dependencies = $8 
         WHERE id = $9 AND project_id = $10 RETURNING *`,
        [
          input.title || task.title,
          input.description || task.description,
          input.status || task.status,
          input.priority || task.priority,
          input.assignee !== undefined ? input.assignee : task.assignee,
          input.dueDate !== undefined ? input.dueDate : task.due_date,
          input.progress !== undefined ? input.progress : task.progress,
          input.dependencies || task.dependencies,
          input.id,
          input.projectId
        ]
      );
      return this.mapTaskRow(result.rows[0]);
    } finally {
      await client.end();
    }
  }

  async deleteTask(id: string, projectId: string): Promise<{ success: boolean; title: string }> {
    const client = await this.getClient();
    try {
      const existingTask = await client.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [id, projectId]);
      if (existingTask.rows.length === 0) {
        throw new Error(`Task with ID ${id} not found in project ${projectId}`);
      }
      
      const task = existingTask.rows[0];
      await client.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2', [id, projectId]);

      return {
        success: true,
        title: task.title
      };
    } finally {
      await client.end();
    }
  }

  async searchTasks(query: string, projectId?: string, fields: string[] = ['title', 'description']): Promise<Task[]> {
    const client = await this.getClient();
    try {
      const searchQuery = query.toLowerCase();
      const conditions: string[] = [];
      const params: any[] = [`%${searchQuery}%`];

      if (fields.includes('title')) {
        conditions.push('LOWER(title) LIKE $1');
      }
      if (fields.includes('description')) {
        conditions.push('LOWER(description) LIKE $1');
      }
      if (fields.includes('assignee')) {
        conditions.push('LOWER(assignee) LIKE $1');
      }

      let sql = `SELECT * FROM tasks WHERE ${conditions.join(' OR ')}`;

      if (projectId) {
        sql += ' AND project_id = $2';
        params.push(projectId);
      }

      sql += ' ORDER BY created_at';

      const result = await client.query(sql, params);
      return result.rows.map(this.mapTaskRow);
    } finally {
      await client.end();
    }
  }

  // Progress calculation
  async updateProjectProgress(projectId: string): Promise<Project> {
    const client = await this.getClient();
    try {
      const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (projectResult.rows.length === 0) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      const project = projectResult.rows[0];
      const tasksResult = await client.query('SELECT progress FROM tasks WHERE project_id = $1', [projectId]);
      
      let progress = 0;
      if (tasksResult.rows.length > 0) {
        const totalProgress = tasksResult.rows.reduce((sum, task) => sum + task.progress, 0);
        progress = Math.round(totalProgress / tasksResult.rows.length);
      }
      
      const result = await client.query('UPDATE projects SET progress = $1 WHERE id = $2 RETURNING *', [progress, projectId]);
      return this.mapProjectRow(result.rows[0]);
    } finally {
      await client.end();
    }
  }

  // Statistics
  async getGlobalStats(): Promise<any> {
    const client = await this.getClient();
    try {
      const [projectsResult, tasksResult] = await Promise.all([
        client.query('SELECT * FROM projects'),
        client.query('SELECT * FROM tasks')
      ]);

      const projects = projectsResult.rows;
      const tasks = tasksResult.rows;

      return {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        projectsByStatus: {
          planning: projects.filter(p => p.status === 'planning').length,
          active: projects.filter(p => p.status === 'active').length,
          onHold: projects.filter(p => p.status === 'on_hold').length,
          completed: projects.filter(p => p.status === 'completed').length,
          cancelled: projects.filter(p => p.status === 'cancelled').length,
        },
        tasksByStatus: {
          notStarted: tasks.filter(t => t.status === 'not_started').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          blocked: tasks.filter(t => t.status === 'blocked').length,
        },
        tasksByPriority: {
          low: tasks.filter(t => t.priority === 'low').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          high: tasks.filter(t => t.priority === 'high').length,
          critical: tasks.filter(t => t.priority === 'critical').length,
        },
        averageProjectProgress: projects.length > 0 
          ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
          : 0,
        averageTaskProgress: tasks.length > 0
          ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
          : 0,
        uniqueAssignees: [...new Set(tasks.filter(t => t.assignee).map(t => t.assignee))].length,
        uniqueOwners: [...new Set(projects.filter(p => p.owner).map(p => p.owner))].length,
      };
    } finally {
      await client.end();
    }
  }

  async getProjectStats(projectId: string): Promise<any> {
    const client = await this.getClient();
    try {
      const [projectResult, tasksResult] = await Promise.all([
        client.query('SELECT * FROM projects WHERE id = $1', [projectId]),
        client.query('SELECT * FROM tasks WHERE project_id = $1', [projectId])
      ]);

      if (projectResult.rows.length === 0) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const project = projectResult.rows[0];
      const tasks = tasksResult.rows;

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: tasks.length,
        tasksByStatus: {
          notStarted: tasks.filter(t => t.status === 'not_started').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
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
          ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
          : 0,
        tasksWithDependencies: tasks.filter(t => t.dependencies && t.dependencies.length > 0).length,
      };
    } finally {
      await client.end();
    }
  }

  // Helper methods
  private mapProjectRow = (row: any): Project => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    progress: row.progress,
    owner: row.owner,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private mapTaskRow = (row: any): Task => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    dueDate: row.due_date,
    progress: row.progress,
    dependencies: row.dependencies || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}