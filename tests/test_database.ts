#!/usr/bin/env bun

import { DatabaseService } from '../src/shared/database-service.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const dbService = new DatabaseService();
    console.log('✅ Database service created');
    
    // Test basic connection with a simple query
    const projects = await dbService.getProjectsOnly();
    console.log(`✅ Database connected successfully`);
    console.log(`📊 Found ${projects.length} projects`);
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`📋 First project: "${project.name}"`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Owner: ${project.owner}`);
      console.log(`   Tags: ${project.tags.join(', ')}`);
      console.log(`   Created: ${project.createdAt.toISOString()}`);
      
      // Test getting tasks for the project
      const tasks = await dbService.getTasksByProjectId(project.id);
      console.log(`📝 Found ${tasks.length} tasks for this project`);
      
      if (tasks.length > 0) {
        console.log(`   First task: "${tasks[0].title}"`);
        console.log(`   Priority: ${tasks[0].priority}`);
        console.log(`   Status: ${tasks[0].status}`);
      }
    }
    
    console.log('\n🎉 Database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check if PostgreSQL is running: docker-compose ps');
    console.log('2. Check if database is accessible: docker exec project_management_db psql -U mcp_user -d project_management -c "SELECT COUNT(*) FROM projects;"');
    console.log('3. Check environment variables in .env file');
    process.exit(1);
  }
}

testDatabaseConnection();