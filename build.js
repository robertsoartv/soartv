#!/usr/bin/env node

import { execSync } from 'child_process';

// Detect if we're on Heroku
const isHeroku = process.env.NODE_ENV === 'production' && (
  process.env.DYNO || 
  process.env.HEROKU_APP_NAME || 
  process.cwd().includes('/tmp/build_')
);

const viteConfig = isHeroku ? './vite.config.heroku.ts' : './vite.config.ts';

console.log(`Building with config: ${viteConfig}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Is Heroku: ${isHeroku}`);

try {
  execSync(`npx vite build --config ${viteConfig}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}