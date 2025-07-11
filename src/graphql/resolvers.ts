import { DatabaseService } from '../shared/database-service.js';

const dbService = new DatabaseService();

// Helper function to convert GraphQL enum to database enum
const mapProjectStatus = (status: string): string => {
  const mapping: { [key: string]: string } = {
    'PLANNING': 'planning',
    'ACTIVE': 'active',
    'ON_HOLD': 'on_hold',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  return mapping[status] || status.toLowerCase();
};

const mapTaskStatus = (status: string): string => {
  const mapping: { [key: string]: string } = {
    'NOT_STARTED': 'not_started',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'BLOCKED': 'blocked'
  };
  return mapping[status] || status.toLowerCase();
};

const mapTaskPriority = (priority: string): string => {
  const mapping: { [key: string]: string } = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'CRITICAL': 'critical'
  };
  return mapping[priority] || priority.toLowerCase();
};

// Helper function to convert database enum to GraphQL enum
const mapToGraphQLProjectStatus = (status: string): string => {
  const mapping: { [key: string]: string } = {
    'planning': 'PLANNING',
    'active': 'ACTIVE',
    'on_hold': 'ON_HOLD',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED'
  };
  return mapping[status] || status.toUpperCase();
};

const mapToGraphQLTaskStatus = (status: string): string => {
  const mapping: { [key: string]: string } = {
    'not_started': 'NOT_STARTED',
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'blocked': 'BLOCKED'
  };
  return mapping[status] || status.toUpperCase();
};

const mapToGraphQLTaskPriority = (priority: string): string => {
  const mapping: { [key: string]: string } = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'critical': 'CRITICAL'
  };
  return mapping[priority] || priority.toUpperCase();
};

export const resolvers = {
  // Query resolvers
  Query: {
    projects: async (_: any, { filters }: { filters?: any }) => {
      try {
        const dbFilters = filters ? {
          status: filters.status ? mapProjectStatus(filters.status) : undefined,
          owner: filters.owner,
          tags: filters.tags
        } : undefined;

        const projects = await dbService.getProjectsOnly(dbFilters);
        
        return projects.map(project => ({
          ...project,
          status: mapToGraphQLProjectStatus(project.status),
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error in projects resolver:', error);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }
    },

    project: async (_: any, { id }: { id: string }) => {
      const project = await dbService.getProjectById(id);
      if (!project) return null;

      return {
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        tasks: project.tasks.map(task => ({
          ...task,
          status: mapToGraphQLTaskStatus(task.status),
          priority: mapToGraphQLTaskPriority(task.priority),
          dueDate: task.dueDate?.toISOString(),
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
      };
    },

    searchProjects: async (_: any, { query, fields }: { query: string; fields?: string[] }) => {
      const projects = await dbService.searchProjects(query, fields);
      
      return projects.map(project => ({
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }));
    },

    tasks: async (_: any, { filters }: { filters?: any }) => {
      const dbFilters = filters ? {
        projectId: filters.projectId,
        status: filters.status ? mapTaskStatus(filters.status) : undefined,
        priority: filters.priority ? mapTaskPriority(filters.priority) : undefined,
        assignee: filters.assignee
      } : undefined;

      const tasks = await dbService.getAllTasks(dbFilters);
      
      return tasks.map(task => ({
        ...task,
        status: mapToGraphQLTaskStatus(task.status),
        priority: mapToGraphQLTaskPriority(task.priority),
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));
    },

    task: async (_: any, { id, projectId }: { id: string; projectId: string }) => {
      const task = await dbService.getTaskById(id, projectId);
      if (!task) return null;

      return {
        ...task,
        status: mapToGraphQLTaskStatus(task.status),
        priority: mapToGraphQLTaskPriority(task.priority),
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    },

    searchTasks: async (_: any, { query, projectId, fields }: { query: string; projectId?: string; fields?: string[] }) => {
      const tasks = await dbService.searchTasks(query, projectId, fields);
      
      return tasks.map(task => ({
        ...task,
        status: mapToGraphQLTaskStatus(task.status),
        priority: mapToGraphQLTaskPriority(task.priority),
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));
    },

    globalStats: async () => {
      const stats = await dbService.getGlobalStats();
      return {
        totalProjects: stats.totalProjects,
        totalTasks: stats.totalTasks,
        projectsByStatus: {
          planning: stats.projectsByStatus.planning,
          active: stats.projectsByStatus.active,
          onHold: stats.projectsByStatus.onHold,
          completed: stats.projectsByStatus.completed,
          cancelled: stats.projectsByStatus.cancelled,
        },
        tasksByStatus: {
          notStarted: stats.tasksByStatus.notStarted,
          inProgress: stats.tasksByStatus.inProgress,
          completed: stats.tasksByStatus.completed,
          blocked: stats.tasksByStatus.blocked,
        },
        tasksByPriority: {
          low: stats.tasksByPriority.low,
          medium: stats.tasksByPriority.medium,
          high: stats.tasksByPriority.high,
          critical: stats.tasksByPriority.critical,
        },
        averageProjectProgress: stats.averageProjectProgress,
        averageTaskProgress: stats.averageTaskProgress,
        uniqueAssignees: stats.uniqueAssignees,
        uniqueOwners: stats.uniqueOwners,
      };
    },

    projectStats: async (_: any, { projectId }: { projectId: string }) => {
      const stats = await dbService.getProjectStats(projectId);
      return {
        projectId: stats.projectId,
        projectName: stats.projectName,
        totalTasks: stats.totalTasks,
        tasksByStatus: {
          notStarted: stats.tasksByStatus.notStarted,
          inProgress: stats.tasksByStatus.inProgress,
          completed: stats.tasksByStatus.completed,
          blocked: stats.tasksByStatus.blocked,
        },
        tasksByPriority: {
          low: stats.tasksByPriority.low,
          medium: stats.tasksByPriority.medium,
          high: stats.tasksByPriority.high,
          critical: stats.tasksByPriority.critical,
        },
        overallProgress: stats.overallProgress,
        averageTaskProgress: stats.averageTaskProgress,
        tasksWithDependencies: stats.tasksWithDependencies,
      };
    },
  },

  // Mutation resolvers
  Mutation: {
    createProject: async (_: any, { input }: { input: any }) => {
      const project = await dbService.createProject({
        name: input.name,
        description: input.description,
        status: input.status ? mapProjectStatus(input.status) : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        owner: input.owner,
        tags: input.tags,
      });

      return {
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },

    updateProject: async (_: any, { input }: { input: any }) => {
      const project = await dbService.updateProject({
        id: input.id,
        name: input.name,
        description: input.description,
        status: input.status ? mapProjectStatus(input.status) : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        owner: input.owner,
        tags: input.tags,
      });

      return {
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },

    deleteProject: async (_: any, { id }: { id: string }) => {
      const result = await dbService.deleteProject(id);
      return result.success;
    },

    updateProjectProgress: async (_: any, { id }: { id: string }) => {
      const project = await dbService.updateProjectProgress(id);

      return {
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },

    createTask: async (_: any, { input }: { input: any }) => {
      const task = await dbService.createTask({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: input.status ? mapTaskStatus(input.status) : undefined,
        priority: input.priority ? mapTaskPriority(input.priority) : undefined,
        assignee: input.assignee,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        progress: input.progress,
        dependencies: input.dependencies,
      });

      return {
        ...task,
        status: mapToGraphQLTaskStatus(task.status),
        priority: mapToGraphQLTaskPriority(task.priority),
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    },

    updateTask: async (_: any, { input }: { input: any }) => {
      const task = await dbService.updateTask({
        id: input.id,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: input.status ? mapTaskStatus(input.status) : undefined,
        priority: input.priority ? mapTaskPriority(input.priority) : undefined,
        assignee: input.assignee,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        progress: input.progress,
        dependencies: input.dependencies,
      });

      return {
        ...task,
        status: mapToGraphQLTaskStatus(task.status),
        priority: mapToGraphQLTaskPriority(task.priority),
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    },

    deleteTask: async (_: any, { id, projectId }: { id: string; projectId: string }) => {
      const result = await dbService.deleteTask(id, projectId);
      return result.success;
    },
  },

  // Type resolvers for nested fields
  Project: {
    tasks: async (parent: any) => {
      try {
        const tasks = await dbService.getTasksByProjectId(parent.id);
        return tasks.map(task => ({
          ...task,
          status: mapToGraphQLTaskStatus(task.status),
          priority: mapToGraphQLTaskPriority(task.priority),
          dueDate: task.dueDate?.toISOString(),
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching tasks for project:', parent.id, error);
        return [];
      }
    },
    
    taskCount: async (parent: any) => {
      try {
        const tasks = await dbService.getTasksByProjectId(parent.id);
        return tasks.length;
      } catch (error) {
        console.error('Error getting task count for project:', parent.id, error);
        return 0;
      }
    },
    
    completedTaskCount: async (parent: any) => {
      try {
        const tasks = await dbService.getTasksByProjectId(parent.id);
        return tasks.filter(task => task.status === 'completed').length;
      } catch (error) {
        console.error('Error getting completed task count for project:', parent.id, error);
        return 0;
      }
    },
  },

  Task: {
    project: async (parent: any) => {
      const project = await dbService.getProjectById(parent.projectId);
      if (!project) return null;

      return {
        ...project,
        status: mapToGraphQLProjectStatus(project.status),
        startDate: project.startDate?.toISOString(),
        endDate: project.endDate?.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    },
  },

  // Custom scalar resolvers
  DateTime: {
    serialize: (value: any) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
    parseValue: (value: any) => {
      return new Date(value);
    },
    parseLiteral: (ast: any) => {
      return new Date(ast.value);
    },
  },
};