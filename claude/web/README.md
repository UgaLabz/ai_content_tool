# AI Content Studio - Web Interface

A comprehensive web application for AI-powered content creation with character management.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # API and external services
├── store/         # State management (Zustand)
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (to be added)
- **API Client**: Axios (to be added)
- **UI Components**: shadcn/ui (to be added)
- **Testing**: Vitest + React Testing Library (to be added)

## Phase 1 Progress

### Phase 1.1.1: Project Setup ✅
- [x] Initialize React project with Vite
- [x] Configure TypeScript
- [x] Setup Tailwind CSS
- [x] Configure ESLint & Prettier
- [x] Setup Git hooks (Husky) - pending git init
- [x] Create folder structure
- [x] Update relevant docs

### Phase 1.1.2: API Integration (Next)
- [ ] Create API client class
- [ ] Setup axios with interceptors
- [ ] Define TypeScript types for API
- [ ] Create error handling utilities
- [ ] Setup environment variables

### Phase 1.1.3: Base UI Components
- [ ] Install and configure shadcn/ui
- [ ] Create theme provider
- [ ] Build Button component
- [ ] Build Input components
- [ ] Build Card component
- [ ] Create Layout components