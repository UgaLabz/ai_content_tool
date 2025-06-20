# Frontend Development Guide

## Overview

The AI Content Studio web interface is a modern React application built with TypeScript, providing a comprehensive UI for AI-powered content generation with character management.

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + custom UI components
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Key Features

### Character Management System
- **Multi-step Character Creator**: Visual wizard for creating AI personalities
- **Character Gallery**: Browse, search, and filter characters
- **Character Details**: View and edit character properties
- **Avatar Management**: Upload and compress character images

### UI Components

#### Core Components
- **Button**: Accessible button with variants (primary, secondary, outline, ghost)
- **Input/Textarea**: Form inputs with validation states
- **Select/Dropdown**: Accessible select components
- **Card**: Container component for content sections

#### Advanced Components
- **Slider**: Range input for personality traits (0-100)
- **Skeleton**: Loading placeholders for better perceived performance
- **ThemeToggle**: Dark/light mode switcher
- **Alert/Toast**: Notification systems
- **Tabs**: Organized content sections
- **Badge**: Tag display for traits and values
- **ConfirmDialog**: User confirmation modals

#### Character-Specific Components
- **CharacterCard**: Display character summary
- **CharacterCreatorForm**: Multi-step form wizard
- **AvatarUpload**: Image upload with compression
- **PersonalitySliders**: Big Five trait adjusters
- **CharacterPreview**: Live preview during creation

### Performance Features

#### Web Vitals Monitoring
```typescript
// Automatic Core Web Vitals tracking
import { reportWebVitals } from './utils/webVitals';

reportWebVitals((metric) => {
  // Send to analytics
  console.log(metric);
});
```

#### Image Compression
```typescript
import { compressImage } from './utils/imageUtils';

const compressed = await compressImage(file, {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8
});
```

#### Loading States
- Skeleton components for all data-loading scenarios
- Progressive content reveal
- Optimistic UI updates

### Accessibility Features

- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus trapping in modals
- **Screen Reader Support**: Semantic HTML and live regions
- **Color Contrast**: WCAG AA compliant color schemes

### Error Handling

#### Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

#### API Error Handling
- Automatic retry logic
- User-friendly error messages
- Fallback UI states
- Error logging and reporting

## Development Workflow

### Setup
```bash
cd claude/web
npm install
npm run dev
```

### Building
```bash
npm run build
npm run preview  # Test production build
```

### Testing
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Code Quality
```bash
npm run lint          # ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
```

## Component Architecture

### File Structure
```
src/components/
├── character/           # Character-related components
│   ├── CharacterCard.tsx
│   ├── CharacterCreatorForm.tsx
│   └── steps/          # Form steps
├── common/             # Shared components
│   ├── ErrorBoundary.tsx
│   └── EmptyState.tsx
├── ui/                 # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Skeleton.tsx
└── theme/              # Theme components
    ├── ThemeProvider.tsx
    └── ThemeToggle.tsx
```

### Component Patterns

#### Composition Pattern
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### Compound Components
```typescript
<Tabs defaultValue="personality">
  <TabsList>
    <TabsTrigger value="personality">Personality</TabsTrigger>
    <TabsTrigger value="voice">Voice</TabsTrigger>
  </TabsList>
  <TabsContent value="personality">...</TabsContent>
  <TabsContent value="voice">...</TabsContent>
</Tabs>
```

## API Integration

### Character API Mapping
The frontend uses a response mapper to transform backend data:

```typescript
// Backend format → Frontend format
const character = mapCharacterResponse(apiResponse);
```

### Type Safety
All API responses are strongly typed:

```typescript
interface Character {
  id: string;
  name: string;
  personality: PersonalityTraits;
  // ... other fields
}
```

## Performance Optimization

### Bundle Size
- Tree shaking enabled
- Dynamic imports for code splitting
- Lazy loading for routes
- Image optimization

### Runtime Performance
- React.memo for expensive components
- useMemo/useCallback for optimization
- Virtual scrolling for large lists
- Debounced search inputs

## Best Practices

### Component Development
1. Start with accessibility in mind
2. Use TypeScript for all components
3. Write tests for critical paths
4. Document complex props
5. Use composition over inheritance

### State Management
1. Keep state as local as possible
2. Use Zustand for global state
3. Implement optimistic updates
4. Handle loading and error states

### Performance
1. Monitor bundle size regularly
2. Use performance profiler
3. Implement proper memoization
4. Lazy load heavy components

## Deployment

### Environment Variables
```env
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000
```

### Production Build
```bash
npm run build
# Output in dist/ directory
```

### Serving
- Can be served from any static host
- Nginx configuration included
- CDN-ready with proper caching headers