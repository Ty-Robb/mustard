#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Register TypeScript
require('ts-node/register');

// Run the script passed as argument
const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('Please provide a script path to run');
  process.exit(1);
}

// Pass along any additional arguments
process.argv = [process.argv[0], scriptPath, ...process.argv.slice(3)];

// Import and run the TypeScript file
require(scriptPath);
