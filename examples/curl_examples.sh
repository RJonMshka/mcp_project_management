#!/bin/bash

# GraphQL API Test Examples using curl
# Make sure the GraphQL server is running: bun run graphql:dev

echo "🚀 GraphQL API Test Examples"
echo "==============================="

GRAPHQL_URL="http://localhost:4000/graphql"

echo -e "\n1. Testing basic project list query..."
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetAllProjects { projects { id name status progress taskCount completedTaskCount owner tags } }"
  }' | jq '.'

echo -e "\n2. Testing detailed project query with tasks..."
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetProjectWithTasks($projectId: ID!) { project(id: $projectId) { id name description status progress owner tags taskCount completedTaskCount tasks { id title status priority progress } } }",
    "variables": { "projectId": "0b3dfaf1-239" }
  }' | jq '.'

echo -e "\n3. Testing global statistics..."
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetGlobalStats { globalStats { totalProjects totalTasks projectsByStatus { planning active completed } tasksByStatus { notStarted inProgress completed } tasksByPriority { low medium high critical } averageProjectProgress averageTaskProgress } }"
  }' | jq '.'

echo -e "\n4. Testing search functionality..."
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query SearchProjects($searchQuery: String!) { searchProjects(query: $searchQuery, fields: [\"name\", \"description\", \"tags\"]) { id name tags owner } }",
    "variables": { "searchQuery": "rust" }
  }' | jq '.'

echo -e "\n5. Testing critical tasks query..."
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCriticalTasks { tasks(filters: { priority: CRITICAL }) { id title description status priority progress } }"
  }' | jq '.'

echo -e "\n==============================="
echo "✅ All curl examples completed!"
echo "💡 Note: Install jq for prettier JSON output: brew install jq"