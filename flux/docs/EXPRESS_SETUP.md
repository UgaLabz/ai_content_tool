# Express Setup Guide

## Quick Start

```bash
# Install dependencies
npm install

# Development with nodemon
npm run dev

# Production
npm start
```

## Project Structure

```
src/
├── routes/      # API routes
├── controllers/ # Route handlers
├── models/      # Data models
├── middleware/  # Custom middleware
└── utils/       # Helper functions
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
```

## Common Middleware

- `express.json()` - Parse JSON bodies
- `cors()` - Enable CORS
- `helmet()` - Security headers
- `morgan()` - Request logging

---
Last updated: [Date]