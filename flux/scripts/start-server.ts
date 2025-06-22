#!/usr/bin/env node

import { spawn } from 'child_process'
import * as path from 'path'

// Start the Express server
const serverPath = path.join(__dirname, '../src/server/index.ts')

const server = spawn('tsx', ['watch', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
})

server.on('error', (error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

process.on('SIGINT', () => {
  server.kill('SIGTERM')
  process.exit(0)
})