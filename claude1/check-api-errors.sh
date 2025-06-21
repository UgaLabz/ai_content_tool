#!/bin/bash

echo "=== Checking API Compilation Errors ==="
cd /home/rese/Documents/ai_content_tool/claude/api

# Check if TypeScript can compile
echo "Running TypeScript check..."
npx tsc --noEmit 2>&1 | head -50

echo
echo "=== Checking for missing dependencies ==="
# Check package.json for canvas
if ! grep -q "canvas" package.json; then
    echo "canvas is not in package.json, adding it..."
    npm install --save canvas
fi

if ! grep -q "axios" package.json; then
    echo "axios is not in package.json, adding it..."
    npm install --save axios
fi

echo
echo "Dependencies installed. Try starting the API again with:"
echo "./start-meme-generator.sh"