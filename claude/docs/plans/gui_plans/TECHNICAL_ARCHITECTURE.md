# Technical Architecture - AI Content Studio

## Overview

The AI Content Studio frontend will be a modern React application that interfaces with the existing FastAPI backend. The architecture emphasizes performance, offline capability, and real-time features.

## Technology Stack

### Core Technologies
- **Framework**: React 18.2+ with TypeScript 5.0+
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **State Management**: Zustand 4.4 + Immer
- **Data Fetching**: TanStack Query v5 (React Query)
- **Real-time**: Socket.io-client 4.7
- **Forms**: React Hook Form 7.5 + Zod validation
- **Router**: TanStack Router (type-safe routing)

### Additional Libraries
- **Rich Text**: Lexical (by Meta)
- **Charts**: Recharts 2.10
- **Animations**: Framer Motion 11
- **Icons**: Lucide React
- **Date**: date-fns 3.0
- **File Upload**: react-dropzone
- **Virtualization**: TanStack Virtual
- **PWA**: Workbox 7.0

## Architecture Patterns

### Component Architecture
```
src/
├── components/          # Shared UI components
│   ├── ui/             # Base components (Button, Input, etc.)
│   ├── common/         # Common components (Header, Sidebar)
│   └── features/       # Feature-specific components
├── features/           # Feature modules
│   ├── characters/
│   ├── generation/
│   ├── content/
│   └── analytics/
├── hooks/              # Custom React hooks
├── lib/               # Utilities and helpers
├── store/             # Zustand stores
├── api/               # API client and types
└── types/             # TypeScript type definitions
```

### State Management Strategy

#### Local State (Zustand)
```typescript
// stores/characterStore.ts
interface CharacterStore {
  characters: Character[];
  selectedCharacter: Character | null;
  isLoading: boolean;
  
  // Actions
  fetchCharacters: () => Promise<void>;
  selectCharacter: (id: string) => void;
  createCharacter: (data: CharacterInput) => Promise<void>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
}

// stores/generationStore.ts
interface GenerationStore {
  currentPrompt: string;
  generationOptions: GenerationOptions;
  streamingOutput: string;
  isGenerating: boolean;
  
  // Actions
  setPrompt: (prompt: string) => void;
  updateOptions: (options: Partial<GenerationOptions>) => void;
  generate: () => Promise<void>;
  stopGeneration: () => void;
}
```

#### Server State (React Query)
```typescript
// hooks/useCharacters.ts
export const useCharacters = () => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: characterAPI.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// hooks/useGeneration.ts
export const useGenerate = () => {
  return useMutation({
    mutationFn: generationAPI.generate,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['content']);
    },
  });
};
```

### API Client Architecture

```typescript
// api/client.ts
class APIClient {
  private axios: AxiosInstance;
  private socket: Socket | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  // REST methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  // WebSocket methods
  connectWebSocket() {
    this.socket = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
    });
  }

  // Streaming
  async* streamGeneration(data: GenerationRequest) {
    const response = await fetch(`${this.baseURL}/generate/stream`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          yield JSON.parse(data);
        }
      }
    }
  }
}
```

### Component Patterns

#### Feature Module Structure
```typescript
// features/characters/index.ts
export { CharacterList } from './components/CharacterList';
export { CharacterCreator } from './components/CharacterCreator';
export { CharacterDetail } from './components/CharacterDetail';
export { useCharacters, useCharacter } from './hooks';
export type { Character, CharacterInput } from './types';
```

#### Smart/Dumb Component Pattern
```typescript
// Smart Component (Container)
const CharacterListContainer: FC = () => {
  const { characters, isLoading } = useCharacters();
  const { selectCharacter } = useCharacterStore();

  if (isLoading) return <CharacterListSkeleton />;

  return (
    <CharacterList
      characters={characters}
      onSelect={selectCharacter}
    />
  );
};

// Dumb Component (Presentational)
interface CharacterListProps {
  characters: Character[];
  onSelect: (character: Character) => void;
}

const CharacterList: FC<CharacterListProps> = ({ characters, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          onClick={() => onSelect(character)}
        />
      ))}
    </div>
  );
};
```

### Real-time Features

#### WebSocket Integration
```typescript
// services/realtimeService.ts
class RealtimeService {
  private socket: Socket;
  
  connect() {
    this.socket = io(WS_URL);
    
    this.socket.on('generation:progress', (data) => {
      generationStore.updateProgress(data);
    });
    
    this.socket.on('generation:complete', (data) => {
      generationStore.setComplete(data);
    });
  }
  
  startGeneration(params: GenerationParams) {
    this.socket.emit('generation:start', params);
  }
  
  stopGeneration(id: string) {
    this.socket.emit('generation:stop', id);
  }
}
```

#### Server-Sent Events for Streaming
```typescript
// hooks/useStreamGeneration.ts
export const useStreamGeneration = () => {
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const generate = async (params: GenerationParams) => {
    setIsStreaming(true);
    setOutput('');
    
    try {
      const stream = apiClient.streamGeneration(params);
      
      for await (const chunk of stream) {
        setOutput((prev) => prev + chunk.text);
      }
    } finally {
      setIsStreaming(false);
    }
  };
  
  return { output, isStreaming, generate };
};
```

### Performance Optimizations

#### Code Splitting
```typescript
// Lazy load feature modules
const Characters = lazy(() => import('./features/characters'));
const Generation = lazy(() => import('./features/generation'));
const Analytics = lazy(() => import('./features/analytics'));

// Route-based splitting
const routes = [
  {
    path: '/characters',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Characters />
      </Suspense>
    ),
  },
];
```

#### Virtualization for Large Lists
```typescript
// components/VirtualContentList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualContentList: FC<{ items: Content[] }> = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <ContentCard
            key={virtualItem.key}
            content={items[virtualItem.index]}
            style={{
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

#### Optimistic Updates
```typescript
// hooks/useOptimisticUpdate.ts
const useCreateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contentAPI.create,
    onMutate: async (newContent) => {
      await queryClient.cancelQueries(['content']);
      
      const previousContent = queryClient.getQueryData(['content']);
      
      queryClient.setQueryData(['content'], (old) => [...old, newContent]);
      
      return { previousContent };
    },
    onError: (err, newContent, context) => {
      queryClient.setQueryData(['content'], context.previousContent);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['content']);
    },
  });
};
```

### Security Considerations

#### Authentication
```typescript
// services/authService.ts
class AuthService {
  private token: string | null = null;
  
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post('/auth/login', credentials);
    this.token = response.token;
    localStorage.setItem('auth_token', this.token);
    apiClient.setAuthToken(this.token);
  }
  
  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    apiClient.clearAuthToken();
  }
  
  isAuthenticated() {
    return !!this.token;
  }
}
```

#### Input Sanitization
```typescript
// utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
};
```

### Offline Support

#### Service Worker
```typescript
// sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/characters'),
  new NetworkFirst({
    cacheName: 'characters-cache',
    networkTimeoutSeconds: 5,
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);
```

#### Offline Queue
```typescript
// services/offlineQueue.ts
class OfflineQueue {
  private queue: QueuedRequest[] = [];
  
  async add(request: QueuedRequest) {
    this.queue.push(request);
    await this.persist();
  }
  
  async processQueue() {
    if (!navigator.onLine) return;
    
    const pending = [...this.queue];
    this.queue = [];
    
    for (const request of pending) {
      try {
        await apiClient[request.method](request.url, request.data);
      } catch (error) {
        this.queue.push(request);
      }
    }
    
    await this.persist();
  }
  
  private async persist() {
    await localforage.setItem('offline_queue', this.queue);
  }
}
```

### Testing Strategy

#### Unit Tests
```typescript
// CharacterCard.test.tsx
describe('CharacterCard', () => {
  it('displays character information', () => {
    const character = createMockCharacter();
    
    render(<CharacterCard character={character} />);
    
    expect(screen.getByText(character.name)).toBeInTheDocument();
    expect(screen.getByText(character.description)).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const character = createMockCharacter();
    
    render(<CharacterCard character={character} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledWith(character);
  });
});
```

#### Integration Tests
```typescript
// generation.integration.test.tsx
describe('Generation Flow', () => {
  it('generates content with selected character', async () => {
    const { user } = renderWithProviders(<GenerationPage />);
    
    // Select character
    await user.click(screen.getByText('Select Character'));
    await user.click(screen.getByText('Cool Guy'));
    
    // Enter prompt
    await user.type(screen.getByPlaceholderText('Enter prompt'), 'Test prompt');
    
    // Generate
    await user.click(screen.getByText('Generate'));
    
    // Wait for result
    await waitFor(() => {
      expect(screen.getByText(/generated content/i)).toBeInTheDocument();
    });
  });
});
```

### Build & Deployment

#### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'AI Content Studio',
        short_name: 'AI Studio',
        theme_color: '#6366F1',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils': ['date-fns', 'clsx', 'zod'],
        },
      },
    },
  },
});
```

#### Docker Configuration
```dockerfile
# Dockerfile.web
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```