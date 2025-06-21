# Simple AI Image Generator Architecture

## Overview

The Simple AI Image Generator is a lightweight GUI application that interfaces with ComfyUI to generate images using various Stable Diffusion models. The architecture emphasizes simplicity, modularity, and extensibility.

## System Components

### 1. GUI Layer (`comfyui_simple_gui.py`)
- **Technology**: Tkinter (Python standard library)
- **Purpose**: User interface for prompt input and image display
- **Features**:
  - Model selection dropdown
  - Resolution picker
  - Prompt input area
  - Real-time image display
  - Progress indication

### 2. Configuration System
- **Core File**: `model_configs.json`
- **Manager**: `model_config_manager.py`
- **Purpose**: Centralized model configuration and management
- **Features**:
  - Model specifications
  - VRAM requirements
  - Resolution options
  - Workflow templates

### 3. ComfyUI Integration
- **Protocol**: HTTP REST API
- **Port**: 8188 (default)
- **Communication**: JSON-based workflow submission
- **Image Retrieval**: Direct HTTP download

### 4. Workflow System
- **Location**: `workflows/` directory
- **Format**: JSON templates with variable substitution
- **Types**:
  - SD 1.5 workflows
  - SD 2.1 workflows
  - SDXL workflows (with refiner)

## Data Flow

```
User Input → GUI → Configuration Manager → Workflow Generator
                                                 ↓
Image Display ← Image Queue ← ComfyUI API ← Workflow Submission
```

## Key Design Decisions

### 1. Configuration-Driven
- All model settings externalized to JSON
- Easy to add new models without code changes
- Validation built into configuration manager

### 2. Asynchronous Processing
- Image generation in background threads
- Non-blocking UI updates
- Queue-based image handling

### 3. Model Agnostic
- Workflow templates for different model types
- Dynamic parameter adjustment
- Capability detection

### 4. Minimal Dependencies
- Standard library for GUI (Tkinter)
- Only essential packages (PIL, requests)
- No heavy ML frameworks in GUI

## Directory Structure

```
simple_image_gen/
├── comfyui_simple_gui.py       # Main GUI application
├── model_config_manager.py     # Configuration management
├── model_configs.json          # Model specifications
├── requirements.txt            # Python dependencies
├── start_image_generator.sh    # Startup script
├── workflows/                  # ComfyUI workflow templates
│   ├── sd15_template.json
│   ├── sd21_template.json
│   └── sdxl_template.json
├── generated_images/           # Output directory
└── docs/                       # Documentation

```

## Configuration Architecture

### Model Configuration
```json
{
  "models": {
    "model-id": {
      "display_name": "...",
      "type": "...",
      "checkpoint_files": [...],
      "vram_requirements": {...},
      "resolutions": {...},
      "optimal_settings": {...}
    }
  }
}
```

### Workflow Templates
- Parameterized JSON workflows
- Variable substitution at runtime
- Model-specific optimizations

## Integration Points

### ComfyUI Server
- **Endpoint**: `/prompt` - Submit workflows
- **Endpoint**: `/history` - Check generation status
- **Endpoint**: `/view` - Download generated images
- **Endpoint**: `/system_stats` - Server health check

### Future Extensions
1. **Model Manager Module** - Download and validate models
2. **Preset System** - Save/load generation settings
3. **Batch Processing** - Generate multiple images
4. **Advanced UI** - Modern framework (CustomTkinter/Kivy)

## Performance Considerations

### Memory Management
- Models loaded by ComfyUI (not GUI)
- Minimal GUI memory footprint
- Image display optimization

### Threading Model
- Main thread: UI updates
- Background threads: API calls
- Queue-based communication

### Error Handling
- Server connection validation
- Model availability checks
- Graceful degradation

## Security Considerations

1. **Local Only**: No external API calls
2. **Input Validation**: Sanitized prompts
3. **File System**: Controlled output directory
4. **No Credentials**: No authentication required

## Scalability

The architecture supports:
- Adding new models via configuration
- Custom workflow templates
- Multiple ComfyUI backends
- Plugin system for extensions