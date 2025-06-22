#!/bin/bash

# Flux Browser Startup Script

echo "🚀 Starting Flux Browser Application"
echo "===================================="

# Check if ComfyUI is running
if ! curl -s http://localhost:8188/system_stats > /dev/null; then
    echo "⚠️  ComfyUI is not running!"
    echo "Please start ComfyUI first with:"
    echo "cd /media/rese/AL/ComfyUI && python main.py --listen"
    echo ""
    read -p "Press Enter once ComfyUI is running..."
fi

# Create necessary directories
mkdir -p public/uploads public/generated

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the application
echo ""
echo "Starting Flux Browser..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo ""

npm run dev