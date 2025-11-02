#!/usr/bin/env node

const { spawn } = require('child_process');
const process = require('process');
const path = require('path');

// Patterns to filter out
const filterPatterns = [
  /○ Compiling/,
  /✓ Compiled/,
  /GET \/api\//,
  /GET \//,
  /POST \/api\//,
  /POST \//,
  /PUT \/api\//,
  /DELETE \/api\//,
  /⚠️ paginate is slow/,
  /sw\.js/,
  /_not-found/,
];

// Find next binary
const nextPath = path.join(__dirname, '..', 'node_modules', '.bin', 'next');

// Execute the command
const child = spawn(nextPath, ['dev', '--turbopack'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false,
  cwd: path.join(__dirname, '..'),
});

// Filter stdout
child.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      const shouldShow = !filterPatterns.some((pattern) => pattern.test(line));
      if (shouldShow) {
        process.stdout.write(line + '\n');
      }
    }
  });
});

// Filter stderr (but keep errors)
child.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.trim()) {
      const shouldShow = !filterPatterns.some((pattern) => pattern.test(line));
      if (shouldShow || line.includes('Error') || line.includes('error')) {
        process.stderr.write(line + '\n');
      }
    }
  });
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

