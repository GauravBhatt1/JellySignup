#!/usr/bin/env node

// This script helps with Vercel deployment
console.log('Setting up Vercel deployment...');

// Run the build process
const { execSync } = require('child_process');

try {
  console.log('Building client application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Vercel build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}