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

### Phase 1.1.2: API Integration ✅
- [x] Create API client class
- [x] Setup axios with interceptors
- [x] Define TypeScript types for API
- [x] Create error handling utilities
- [x] Setup environment variables

### Phase 1.1.3: Base UI Components ✅
- [x] Install and configure shadcn/ui
- [x] Create theme provider
- [x] Build Button component
- [x] Build Input components
- [x] Build Card component
- [x] Create Layout components

### Phase 1.2: Character Creator UI (Next)
- [ ] Create multi-step form structure
- [ ] Build avatar upload/selection
- [ ] Create personality sliders
- [ ] Add trait tag system
- [ ] Build voice configuration
- [ ] Create catchphrase manager