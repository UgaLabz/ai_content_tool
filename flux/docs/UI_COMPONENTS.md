# UI Components Documentation

This document describes the frontend UI components of the Flux Browser application.

## Component Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with MainLayout
│   ├── page.tsx          # Home page (redirects to /generate)
│   └── generate/         
│       └── page.tsx      # Main generation interface
├── components/           
│   ├── layout/           
│   │   └── main-layout.tsx    # App-wide layout wrapper
│   ├── generation/       
│   │   ├── prompt-input.tsx   # Prompt textarea with suggestions
│   │   ├── parameter-controls.tsx  # Generation parameters
│   │   └── generation-progress.tsx # Progress indicator
│   ├── gallery/          
│   │   └── image-gallery.tsx  # Generated images display
│   └── ui/               # shadcn/ui components
└── lib/                  
    ├── store.ts          # Zustand state management
    └── api-client.ts     # API and WebSocket client
```

## Main Components

### MainLayout
- **Location:** `src/components/layout/main-layout.tsx`
- **Purpose:** Provides consistent app-wide layout
- **Features:**
  - Header with app title
  - Container for responsive layout
  - Toast notifications integration

### PromptInput
- **Location:** `src/components/generation/prompt-input.tsx`
- **Purpose:** Main text input for image generation prompts
- **Features:**
  - Multi-line textarea
  - Prompt suggestions
  - Submit on Enter
  - Disabled state during generation

### ParameterControls
- **Location:** `src/components/generation/parameter-controls.tsx`
- **Purpose:** Controls for generation parameters
- **Features:**
  - Resolution presets (1:1, 16:9, 9:16, etc.)
  - Width/Height sliders (256-1536px)
  - Steps control (1-8, optimized for 4)
  - Seed input with randomize button
  - Sampler selection
  - Scheduler selection

### GenerationProgress
- **Location:** `src/components/generation/generation-progress.tsx`
- **Purpose:** Shows generation progress
- **Features:**
  - Progress bar
  - Loading spinner
  - Percentage display
  - Auto-hide when not generating

### ImageGallery
- **Location:** `src/components/gallery/image-gallery.tsx`
- **Purpose:** Displays generated images
- **Features:**
  - Grid layout (responsive)
  - Image preview with hover overlay
  - Download functionality
  - View full size
  - Prompt display
  - Clear history option

## State Management

### Zustand Store
- **Location:** `src/lib/store.ts`
- **Purpose:** Global state management

**State Structure:**
```typescript
{
  // Current generation
  isGenerating: boolean
  currentPrompt: string
  progress: number
  error: string | null
  
  // History
  history: GeneratedImage[]
}
```

**Actions:**
- `setPrompt` - Update current prompt
- `setGenerating` - Set generation state
- `setProgress` - Update progress
- `setError` - Set error message
- `addToHistory` - Add generated image
- `clearHistory` - Clear all history

## API Integration

### API Client
- **Location:** `src/lib/api-client.ts`
- **Purpose:** HTTP and WebSocket communication

**Features:**
- REST API calls (generate, status, cancel)
- WebSocket real-time updates
- Event listeners for progress
- Error handling
- Image upload support

## UI Library

### shadcn/ui Components
We use shadcn/ui for consistent, accessible components:

- **Button** - Primary actions
- **Card** - Content containers
- **Input** - Form inputs
- **Label** - Form labels
- **Textarea** - Multi-line text input
- **Slider** - Numeric range inputs
- **Progress** - Progress indicators
- **Select** - Dropdown selections
- **Toast** - Notifications

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom theme with CSS variables
- Dark mode support (future)
- Responsive breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Design Tokens
```css
--primary: Main brand color
--secondary: Secondary actions
--muted: Subtle elements
--accent: Highlights
--destructive: Errors/warnings
```

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Full-width controls
- Stack gallery below controls
- Touch-optimized buttons

### Tablet (768px - 1024px)
- 2-column image gallery
- Side-by-side layout starts

### Desktop (> 1024px)
- 3-column layout (1/3 controls, 2/3 gallery)
- 3-column image gallery
- Hover effects enabled

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Loading states announced
- Error messages associated with inputs

## Performance Optimizations

1. **Image Loading**
   - Next.js Image component
   - Lazy loading
   - Responsive sizes
   - WebP format (automatic)

2. **State Updates**
   - Debounced parameter changes
   - Optimistic UI updates
   - Selective re-renders

3. **Bundle Size**
   - Tree-shaking enabled
   - Dynamic imports for heavy components
   - Minimal dependencies

## Future Enhancements

1. **Dark Mode**
   - Theme toggle
   - System preference detection
   - Persistent preference

2. **Advanced Gallery**
   - Filtering and search
   - Folders/collections
   - Bulk operations
   - EXIF data display

3. **Mobile App Features**
   - PWA support
   - Offline viewing
   - Share functionality
   - Camera integration

4. **Collaboration**
   - Share links
   - Public galleries
   - Comments/ratings

---

*Last updated: December 2024*