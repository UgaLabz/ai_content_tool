# Server Management Guide

This guide provides comprehensive instructions for starting, stopping, and managing the AI Content Tool servers.

## Overview

The AI Content Tool consists of two main components:
- **API Server** - Backend REST API (Port 3000)
- **Web Frontend** - React application (Port 5173)

## Quick Start

### Starting All Servers

To start both servers, you'll need two terminal windows:

**Terminal 1 - API Server:**
```bash
cd claude/api
npm run dev
```

**Terminal 2 - Web Frontend:**
```bash
cd claude/web
npm run dev
```

### Verifying Server Status

Once started, verify the servers are running:
- Frontend: http://localhost:5173
- API Health: http://localhost:3000/health
- API Characters: http://localhost:3000/api/characters

## Detailed Server Management

### API Server

**Start Commands:**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build && npm start

# With specific environment
NODE_ENV=production npm start
```

**Expected Console Output:**
```
[INFO]: Resource monitoring started
[INFO]: Intelligent orchestrator initialized
[INFO]: Server listening at http://127.0.0.1:3000
[INFO]: Server started on 0.0.0.0:3000
```

### Web Frontend

**Start Commands:**
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Expected Console Output:**
```
VITE v5.4.2  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: http://xxx.xxx.xxx.xxx:5173/
```

## Stopping Servers

### Graceful Shutdown

**Method 1 - Keyboard Interrupt:**
- Press `Ctrl + C` in each terminal window
- Wait for "Server stopped" or similar confirmation

**Method 2 - Process Management:**
```bash
# Find running processes
ps aux | grep -E "(vite|tsx watch)"

# Stop specific process
kill -SIGTERM <PID>
```

### Force Shutdown

If servers don't respond to graceful shutdown:

```bash
# Force stop all Node.js processes (use with caution)
pkill -f "node.*vite"
pkill -f "tsx watch"

# Alternative - stop by port
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:5173 | xargs kill -9  # Frontend
```

## Common Issues & Solutions

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000  # or :5173

# Kill the process
kill -9 <PID>
```

### API Connection Refused

**Error:** `ERR_CONNECTION_REFUSED` in browser console

**Solutions:**
1. Ensure API server is running
2. Check API URL in `claude/web/.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
3. Verify no firewall blocking port 3000

### Environment Variables Not Loading

**Solution:**
1. Ensure `.env` files exist in both directories
2. Copy from examples if missing:
   ```bash
   cp claude/api/.env.example claude/api/.env
   cp claude/web/.env.example claude/web/.env
   ```
3. Restart servers after changing `.env` files

## Advanced Management

### Running with PM2

For production-like process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start servers
pm2 start claude/api/ecosystem.config.js
pm2 start claude/web/ecosystem.config.js

# Monitor
pm2 monit

# Stop all
pm2 stop all
```

### Docker Deployment

```bash
# Start with Docker Compose
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

### Systemd Service (Linux)

Create service files for automatic startup:

**API Service** (`/etc/systemd/system/ai-content-api.service`):
```ini
[Unit]
Description=AI Content Tool API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/claude/api
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ai-content-api
sudo systemctl start ai-content-api
```

## Monitoring & Debugging

### Check Server Logs

**API Logs:**
```bash
# Real-time logs
cd claude/api
npm run dev 2>&1 | tee api.log

# With timestamps
npm run dev 2>&1 | ts '[%Y-%m-%d %H:%M:%S]'
```

**Frontend Logs:**
- Check browser console (F12)
- Network tab for API calls
- Vite terminal output

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Check specific endpoints
curl http://localhost:3000/api/characters
```

### Performance Monitoring

```bash
# Monitor resource usage
htop  # Interactive process viewer
iostat -x 1  # I/O statistics
netstat -tulpn | grep -E "(3000|5173)"  # Network connections
```

## Best Practices

1. **Always start API server before frontend**
2. **Use separate terminal windows/tabs for each server**
3. **Monitor logs during development**
4. **Gracefully shutdown servers when done**
5. **Keep `.env` files updated and synchronized**
6. **Use version control for configuration**
7. **Document any custom startup procedures**

## Database Management

### Development Database Operations

**Clean Database:**
```bash
# Delete all characters (development only)
npm run clean:db

# Or directly via API
curl -X DELETE http://localhost:3000/api/characters
```

**Full Reset:**
```bash
# Stop servers, clean database, and restart
npm run reset
```

### Character Management API

- **GET** `/api/characters` - List all characters
- **GET** `/api/characters/:id` - Get specific character
- **POST** `/api/characters` - Create new character
- **PATCH** `/api/characters/:id` - Update character
- **DELETE** `/api/characters/:id` - Delete specific character
- **DELETE** `/api/characters` - Delete ALL characters (dev only)

## Quick Reference

| Action | Command |
|--------|---------|
| Start API | `cd claude/api && npm run dev` |
| Start Frontend | `cd claude/web && npm run dev` |
| Stop Server | `Ctrl + C` |
| Check API | `curl http://localhost:3000/health` |
| View Logs | Check terminal output |
| Kill by Port | `lsof -ti:3000 \| xargs kill -9` |
| Clean Database | `npm run clean:db` |
| Full Reset | `npm run reset` |

## Troubleshooting Checklist

- [ ] Both servers started in correct order?
- [ ] Correct directories (`claude/api` and `claude/web`)?
- [ ] `.env` files present and configured?
- [ ] Ports 3000 and 5173 available?
- [ ] Node.js version 18+ installed?
- [ ] Dependencies installed (`npm install`)?
- [ ] No firewall blocking ports?
- [ ] Correct API URL in frontend config?

For more detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).