#!/usr/bin/env bun

import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '../graphql/resolvers.js';
import { typeDefs } from '../graphql/schema.js';

const PORT = process.env.GRAPHQL_PORT || 4000;
const HOST = process.env.GRAPHQL_HOST || 'localhost';

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