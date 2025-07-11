#!/usr/bin/env node

// Simple test to verify GraphQL queries work with the current database
// This assumes the GraphQL server is running on localhost:4000

async function testGraphQLQuery() {
  console.log('Testing GraphQL query against live server...');
  
  try {
    // Test query to get all projects
    const query = `
      query GetAllProjects {
        projects {
          id
          name
          description
          status
          progress
          owner
          tags
          taskCount
          completedTaskCount
        }
      }
    `;

    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      return;
    }

    console.log('✅ GraphQL Query Successful!');
    console.log('📊 Response Data:');
    console.log(JSON.stringify(result.data, null, 2));
    
    // Verify the expected data structure
    const projects = result.data.projects;
    if (projects && projects.length > 0) {
      const project = projects[0];
      console.log(`\n📋 Project Found: "${project.name}"`);
      console.log(`📝 Tasks: ${project.taskCount} total, ${project.completedTaskCount} completed`);
      console.log(`🏷️ Tags: ${project.tags.join(', ')}`);
      console.log(`👤 Owner: ${project.owner}`);
      console.log(`📈 Progress: ${project.progress}%`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the GraphQL server is running:');
    console.log('   bun run graphql:dev');
  }
}

testGraphQLQuery();