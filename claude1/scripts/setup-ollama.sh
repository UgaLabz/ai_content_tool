#!/bin/bash

echo "🚀 Setting up Ollama for AI Content Generator"
echo "============================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Ollama is installed
if command_exists ollama; then
    echo "✅ Ollama is already installed"
    ollama --version
else
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Failed to install Ollama"
        exit 1
    fi
fi

# Check if Ollama is running
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama server is running"
else
    echo "🔄 Starting Ollama server..."
    ollama serve &
    sleep 5
fi

# Pull recommended models
echo ""
echo "📥 Pulling recommended models..."
echo "This may take a while depending on your internet speed."

# Array of models to pull
models=(
    "llama3.1:8b"
    "mistral:7b"
    "gemma:2b"
)

for model in "${models[@]}"; do
    echo ""
    echo "Pulling $model..."
    ollama pull "$model"
    
    if [ $? -eq 0 ]; then
        echo "✅ $model pulled successfully"
    else
        echo "⚠️  Failed to pull $model (continuing...)"
    fi
done

# List available models
echo ""
echo "📋 Available models:"
ollama list

echo ""
echo "✅ Ollama setup complete!"
echo ""
echo "You can now:"
echo "1. Start the API server: cd api && npm run dev"
echo "2. Test Ollama directly: ollama run llama3.1:8b"
echo "3. Pull additional models: ollama pull <model-name>"
echo ""
echo "For more models, visit: https://ollama.ai/library"