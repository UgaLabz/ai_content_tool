# Architecture Overview

## System Design

The Flux Browser App follows a modular architecture designed for scalability and maintainability. It combines local AI processing capabilities with cloud-based services, providing flexibility in deployment and usage.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐   │
│  │   UI Layer  │ │ State Mgmt   │ │   API Client      │   │
│  │  (React)    │ │  (Zustand)   │ │   (Axios)         │   │
│  └─────────────┘ └──────────────┘ └───────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services (Node.js)                │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐   │
│  │  API Routes │ │  WebSocket   │ │  Queue Manager    │   │
│  │  (Express)  │ │  (Socket.io) │ │                   │   │
│  └─────────────┘ └──────────────┘ └───────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   Local Generation        │   │   Cloud Generation        │
│  ┌─────────────────┐     │   │  ┌─────────────────┐     │
│  │    ComfyUI      │     │   │  │   Flux API      │     │
│  │  Integration    │     │   │  │   (BFL)         │     │
│  └─────────────────┘     │   │  └─────────────────┘     │
│  ┌─────────────────┐     │   │  ┌─────────────────┐     │
│  │  Flux Schnell   │     │   │  │ Flux Pro/Ultra  │     │
│  │   Models        │     │   │  │   Models        │     │
│  └─────────────────┘     │   │  └─────────────────┘     │
└───────────────────────────┘   └───────────────────────────┘
```

## Key Components

### 1. **Frontend (Next.js + React)**
- **App Router**: Modern Next.js 14+ routing system
- **Server Components**: Optimized rendering and data fetching
- **Client Components**: Interactive UI elements
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 2. **State Management (Zustand)**
- **Generation State**: Tracks current generation parameters
- **History Store**: Manages generated images and metadata
- **UI State**: Controls modals, panels, and user preferences
- **WebSocket State**: Real-time connection status

### 3. **Backend Services (Node.js)**
- **API Layer**: RESTful endpoints for generation requests
- **WebSocket Server**: Real-time progress updates
- **Queue System**: Manages concurrent generation requests
- **File Management**: Handles image storage and retrieval

### 4. **AI Integration Layer**
- **ComfyUI Wrapper**: Abstracts ComfyUI API complexity
- **Flux API Client**: Handles cloud generation requests
- **Model Manager**: Switches between local/cloud models
- **Error Recovery**: Automatic retry and fallback logic

### 5. **Storage Architecture**
```
/media/rese/AL/flux/
├── checkpoints/      # Main model files
├── clip/            # Text encoders
├── vae/             # VAE models
└── loras/           # LoRA adaptations (future)

/flux/public/
├── uploads/         # User uploaded images
└── generated/       # Generated outputs
```

## Data Flow

### Local Generation Flow
```
1. User Input → Frontend Form
2. API Request → Backend Queue
3. ComfyUI Workflow → Generation
4. WebSocket Updates → Progress Bar
5. Image Result → Gallery Display
```

### Cloud Generation Flow
```
1. User Input → Frontend Form
2. API Request → Flux API Client
3. BFL API → Cloud Processing
4. Polling/Webhook → Status Updates
5. Image URL → Download & Display
```

## Design Decisions

### Why Next.js App Router?
- Server-side rendering for better SEO
- Built-in API routes reduce complexity
- Excellent TypeScript support
- Modern React features (Server Components)

### Why Zustand for State?
- Minimal boilerplate compared to Redux
- TypeScript-first design
- Built-in devtools support
- Perfect size for this application

### Why ComfyUI Integration?
- Mature ecosystem for Stable Diffusion models
- Supports Flux models natively
- Visual workflow creation
- Active community and updates

### WebSocket Architecture
- Real-time progress updates enhance UX
- Allows cancellation of in-progress generations
- Efficient for queue status updates
- Fallback to polling for reliability

## Security Considerations

1. **API Key Management**
   - Environment variables for sensitive data
   - Client-side keys never exposed
   - Rate limiting on all endpoints

2. **File Upload Security**
   - File type validation
   - Size limits enforced
   - Virus scanning (future)
   - Isolated storage directory

3. **Model Access**
   - Read-only model directory mounting
   - No direct file system access from web
   - Sanitized file paths

## Performance Optimizations

1. **Frontend**
   - Image lazy loading
   - Virtual scrolling for galleries
   - Optimistic UI updates
   - Service worker caching

2. **Backend**
   - Connection pooling
   - Request queuing
   - Memory-efficient streaming
   - Graceful degradation

3. **AI Processing**
   - FP8 quantization for speed
   - Batch processing support
   - GPU memory management
   - Model preloading

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for shared queue (future)
- Load balancer ready
- Microservice architecture compatible

### Vertical Scaling
- Efficient memory usage
- GPU resource pooling
- Concurrent request handling
- Background job processing

## Future Enhancements

1. **Planned Features**
   - Multi-GPU support
   - Distributed processing
   - Model fine-tuning UI
   - Plugin architecture

2. **Technical Improvements**
   - GraphQL API option
   - Kubernetes deployment
   - CDN integration
   - Advanced caching strategies

3. **AI Capabilities**
   - ControlNet integration
   - Video generation
   - 3D model support
   - Real-time editing

---
Last updated: December 2024