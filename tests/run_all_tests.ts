#!/usr/bin/env bun

import { spawn } from 'child_process';
import { promisify } from 'util';

const exec = promisify(spawn);

async function runTest(testName: string, command: string[]): Promise<boolean> {
  console.log(`\n🔍 Running ${testName}...`);
  console.log(`Command: ${command.join(' ')}`);
  
  try {
    const process = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        if (code === 0) {
          console.log(`✅ ${testName} passed`);
          resolve(true);
        } else {
          console.log(`❌ ${testName} failed with exit code ${code}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error(`❌ ${testName} failed:`, error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running all tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'MCP Server Test',
      command: ['bun', 'run', 'tests/test_server.ts']
    },
    {
      name: 'Database Connection Test',
      command: ['bun', 'run', 'tests/test_database.ts']
    },
    {
      name: 'GraphQL API Test',
      command: ['node', 'tests/test_detailed_query.js']
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test.name, test.command);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runAllTests();