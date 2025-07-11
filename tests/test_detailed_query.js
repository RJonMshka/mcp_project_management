#!/usr/bin/env node

// Test detailed GraphQL queries including project with tasks
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';
const PROJECT_ID = '0b3dfaf1-239'; // Known project ID from snapshot

async function graphqlRequest(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

async function testBasicProjectQuery() {
  console.log('🔍 Testing basic project list query...');
  
  const query = `
    query GetAllProjects {
      projects {
        id
        name
        status
        progress
        taskCount
        completedTaskCount
        owner
        tags
      }
    }
  `;

  const data = await graphqlRequest(query);
  console.log('✅ Basic query successful');
  console.log(`📊 Found ${data.projects.length} project(s)`);
  
  if (data.projects.length > 0) {
    const project = data.projects[0];
    console.log(`   Project: "${project.name}" (${project.status})`);
    console.log(`   Tasks: ${project.taskCount} total, ${project.completedTaskCount} completed`);
    console.log(`   Owner: ${project.owner}`);
  }
  
  return data.projects;
}

async function testDetailedProjectQuery() {
  console.log('\n🔍 Testing detailed project query with tasks...');
  
  const query = `
    query GetProjectWithTasks($projectId: ID!) {
      project(id: $projectId) {
        id
        name
        description
        status
        progress
        owner
        tags
        taskCount
        completedTaskCount
        tasks {
          id
          title
          description
          status
          priority
          progress
          createdAt
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { projectId: PROJECT_ID });
  console.log('✅ Detailed query successful');
  
  const project = data.project;
  if (project) {
    console.log(`📋 Project: "${project.name}"`);
    console.log(`📝 Description: ${project.description.substring(0, 100)}...`);
    console.log(`📊 Tasks: ${project.tasks.length} loaded`);
    
    // Show first few tasks
    console.log('\n📝 First 3 tasks:');
    project.tasks.slice(0, 3).forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.title}" (${task.priority} priority)`);
      console.log(`      Status: ${task.status}, Progress: ${task.progress}%`);
    });
    
    // Show task priority distribution
    const priorityCount = project.tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Task Priority Distribution:');
    Object.entries(priorityCount).forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} tasks`);
    });
  }
  
  return project;
}

async function testGlobalStats() {
  console.log('\n🔍 Testing global statistics query...');
  
  const query = `
    query GetGlobalStats {
      globalStats {
        totalProjects
        totalTasks
        projectsByStatus {
          planning
          active
          completed
        }
        tasksByStatus {
          notStarted
          inProgress
          completed
        }
        tasksByPriority {
          low
          medium
          high
          critical
        }
        averageProjectProgress
        averageTaskProgress
      }
    }
  `;

  const data = await graphqlRequest(query);
  console.log('✅ Global stats query successful');
  
  const stats = data.globalStats;
  console.log(`📊 Global Statistics:`);
  console.log(`   Total Projects: ${stats.totalProjects}`);
  console.log(`   Total Tasks: ${stats.totalTasks}`);
  console.log(`   Average Project Progress: ${stats.averageProjectProgress}%`);
  console.log(`   Average Task Progress: ${stats.averageTaskProgress}%`);
  
  console.log('\n📊 Projects by Status:');
  Object.entries(stats.projectsByStatus).forEach(([status, count]) => {
    if (count > 0) console.log(`   ${status}: ${count}`);
  });
  
  console.log('\n📊 Tasks by Priority:');
  Object.entries(stats.tasksByPriority).forEach(([priority, count]) => {
    if (count > 0) console.log(`   ${priority}: ${count}`);
  });
  
  return stats;
}

async function testSearchQuery() {
  console.log('\n🔍 Testing search functionality...');
  
  const query = `
    query SearchProjects($searchQuery: String!) {
      searchProjects(query: $searchQuery, fields: ["name", "description", "tags"]) {
        id
        name
        tags
        owner
      }
    }
  `;

  const data = await graphqlRequest(query, { searchQuery: 'rust' });
  console.log('✅ Search query successful');
  console.log(`🔍 Found ${data.searchProjects.length} project(s) matching "rust"`);
  
  data.searchProjects.forEach(project => {
    console.log(`   "${project.name}" by ${project.owner}`);
    console.log(`   Tags: ${project.tags.join(', ')}`);
  });
  
  return data.searchProjects;
}

async function runAllTests() {
  console.log('🚀 Starting GraphQL API Tests');
  console.log('=' .repeat(50));
  
  try {
    await testBasicProjectQuery();
    await testDetailedProjectQuery();
    await testGlobalStats();
    await testSearchQuery();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('🎉 GraphQL API is working correctly with the database snapshot');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure the database is running: docker-compose up -d');
    console.log('2. Make sure the GraphQL server is running: bun run graphql:dev');
    console.log('3. Check if the server is accessible: curl http://localhost:4000/graphql');
  }
}

runAllTests();