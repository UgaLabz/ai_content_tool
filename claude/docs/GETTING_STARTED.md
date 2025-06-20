# Getting Started Guide

This guide provides comprehensive instructions for setting up, starting, and stopping the AI Content Tool.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18.20.0 or higher)
- **npm** (v10.8.0 or higher)
- **Git**
- **Ollama** (for local LLM support)
- **LocalAI** (optional, for additional local models)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai_content_tool.git
cd ai_content_tool
```

### 2. Install Dependencies

#### Backend (API) Setup
```bash
cd claude/api
npm install
```

#### Frontend (Web) Setup
```bash
cd ../web
npm install
```

### 3. Environment Configuration

#### Backend Configuration
Create a `.env` file in `claude/api/`:

```bash
cd claude/api
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# LLM Provider Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1:8b

# Optional Providers
LMSTUDIO_HOST=ws://localhost
LMSTUDIO_PORT=1234

LOCALAI_HOST=http://localhost
LOCALAI_PORT=8080
```

#### Frontend Configuration
The frontend uses environment variables for API configuration. Create a `.env` file in `claude/web/`:

```bash
cd claude/web
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEBUG=true
```

## Starting the Application

### Method 1: Manual Start (Recommended for Development)

#### Step 1: Start the Backend API Server

Open a terminal and run:
```bash
cd claude/api
npm run dev
```

You should see:
```
[INFO] Server started on 0.0.0.0:3000
[INFO] Character profile manager initialized
[INFO] Ollama service initialized
```

The API will be available at: http://localhost:3000

#### Step 2: Start the Frontend Development Server

Open a **new terminal** and run:
```bash
cd claude/web
npm run dev
```

You should see:
```
VITE v6.3.5  ready in 104 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

The web interface will be available at: http://localhost:5173

### Method 2: Using Scripts (Coming Soon)

We're working on convenience scripts to start all services with one command.

## Verifying the Installation

1. **Check API Health**: 
   ```bash
   curl http://localhost:3000/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-20T14:00:00.000Z",
     "providers": ["Ollama", "LocalAI"]
   }
   ```

2. **Check Frontend**: 
   Open http://localhost:5173 in your browser. You should see the AI Content Studio interface.

3. **Check Character API**:
   ```bash
   curl http://localhost:3000/api/characters
   ```

## Stopping the Application

### Graceful Shutdown

#### Method 1: Using Keyboard Shortcuts

1. **Stop Frontend Server**: 
   - In the terminal running the frontend, press `Ctrl + C`
   - Wait for the message: "Terminated"

2. **Stop Backend Server**:
   - In the terminal running the backend, press `Ctrl + C`
   - Wait for the message: "Shutting down server..."

#### Method 2: Using Process Commands

If you need to force stop all services:

```bash
# Find and stop all Node.js processes
pkill -f "node.*vite"     # Stop frontend
pkill -f "tsx watch"      # Stop backend
```

### Verify Shutdown

Check that no services are running:
```bash
# Check if ports are free
lsof -i :3000  # Should return nothing
lsof -i :5173  # Should return nothing
```

## Common Issues and Solutions

### Port Already in Use

If you see "EADDRINUSE" errors:

```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>

# For port 5173
lsof -i :5173
kill -9 <PID>
```

### API Connection Errors

If the frontend can't connect to the API:

1. Ensure the API is running on port 3000
2. Check CORS is enabled in the API
3. Verify the `VITE_API_URL` in frontend `.env`

### Character Data Not Loading

If characters appear as empty objects:

1. Restart the API server
2. Check that character JSON files exist in `claude/api/data/characters/profiles/`
3. Verify the character serializer is working

## Development Workflow

### Hot Reloading

Both servers support hot reloading:
- **Frontend**: Changes to React components update instantly
- **Backend**: API restarts automatically when files change

### Logs

- **API Logs**: Displayed in the terminal running `npm run dev` in the API directory
- **Frontend Logs**: Check the browser console for React errors
- **Build Logs**: Run `npm run build` to check for compilation errors

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./deployment-guide.md).

## Additional Resources

- [API Reference](./api-reference.md)
- [Frontend Development Guide](./frontend-guide.md)
- [Character System Guide](./character-system.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Quick Reference

### Start Commands
```bash
# Terminal 1 - API
cd claude/api && npm run dev

# Terminal 2 - Frontend  
cd claude/web && npm run dev
```

### Stop Commands
```bash
# Graceful shutdown
Ctrl + C in each terminal

# Force shutdown
pkill -f "node.*vite" && pkill -f "tsx watch"
```

### URLs
- Frontend: http://localhost:5173
- API: http://localhost:3000
- API Health: http://localhost:3000/health
- Characters: http://localhost:3000/api/characters