#!/bin/bash

echo "=== Restarting AI Content Tool API ==="

# Kill existing API processes
echo "Stopping existing API processes..."
pkill -f "tsx watch src/index.ts"
pkill -f "node.*api"
sleep 2

# Navigate to API directory
cd /home/rese/Documents/ai_content_tool/claude/api

# Install missing dependencies
echo "Installing dependencies..."
npm install axios canvas

# Start the API
echo "Starting API server..."
npm run dev &

echo
echo "API should be starting on http://localhost:3000"
echo "Check logs with: tail -f /home/rese/Documents/ai_content_tool/claude/api/server.log"
echo
echo "To start Ollama with GPU:"
echo "sudo pkill ollama && sleep 2"
echo "HSA_OVERRIDE_GFX_VERSION=10.3.0 ROCR_VISIBLE_DEVICES=0 ollama serve"