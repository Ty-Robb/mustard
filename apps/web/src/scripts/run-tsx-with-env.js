#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Get the script path and arguments
const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('Please provide a script path to run');
  process.exit(1);
}

// Build the command with tsx
const { spawn } = require('child_process');
const args = ['tsx', scriptPath, ...process.argv.slice(3)];

// Run tsx with the script
const child = spawn('npx', args, {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});
