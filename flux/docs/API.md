# API Documentation

Base URL: `http://localhost:3001`

## Overview

The Flux Image Generation API provides endpoints for generating AI images using ComfyUI and Flux models. It supports real-time progress updates via WebSocket connections.

## WebSocket Events

Connect to: `ws://localhost:3001`

### Server → Client Events

- `generation:start` - Generation process has started
  ```json
  { "id": "generation-uuid" }
  ```

- `generation:progress` - Progress update
  ```json
  { "id": "generation-uuid", "progress": 50 }
  ```

- `generation:complete` - Generation completed successfully
  ```json
  { "id": "generation-uuid", "url": "http://..." }
  ```

- `generation:error` - Generation failed
  ```json
  { "id": "generation-uuid", "error": "Error message" }
  ```

- `generation:cancelled` - Generation was cancelled
  ```json
  { "id": "generation-uuid" }
  ```

## REST Endpoints

### Health Check

#### GET /api/health
Check API and ComfyUI connection status.

**Response:**
```json
{
  "status": "ok",
  "comfyui": "connected",
  "timestamp": "2025-01-22T12:00:00.000Z"
}
```

### System Stats

#### GET /api/system
Get ComfyUI system statistics and GPU information.

**Response:**
```json
{
  "system": {
    "os": "linux",
    "python_version": "3.11.0",
    "embedded_python": false
  },
  "devices": [
    {
      "name": "NVIDIA GeForce RTX 3090",
      "type": "cuda",
      "index": 0,
      "vram_total": 25769803776,
      "vram_free": 20000000000,
      "torch_vram_total": 25769803776,
      "torch_vram_free": 20000000000
    }
  ]
}
```

### Image Generation

#### POST /api/generate
Generate a new image with specified parameters.

**Request Body:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 123456,
  "sampler": "euler",
  "scheduler": "simple"
}
```

**Parameters:**
- `prompt` (required) - Text description of the image to generate
- `width` (optional, default: 1024) - Image width in pixels (256-1536, step: 64)
- `height` (optional, default: 1024) - Image height in pixels (256-1536, step: 64)
- `steps` (optional, default: 4) - Number of denoising steps (1-8)
- `seed` (optional) - Random seed for reproducibility
- `sampler` (optional, default: "euler") - Sampling algorithm
  - Options: euler, euler_ancestral, heun, dpm_2, dpm_2_ancestral, lms, dpmpp_2m, dpmpp_sde
- `scheduler` (optional, default: "simple") - Noise scheduler
  - Options: simple, normal, karras, exponential, sgm_uniform
- `outputPath` (optional) - Custom output directory path (Note: ComfyUI limitation - path must exist in ComfyUI settings)
- `filenameOverride` (optional) - Custom filename prefix for the generated image

**Response:**
```json
{
  "success": true,
  "id": "8474a603-53a5-4cba-b196-25c6ec8a1f48",
  "url": "http://localhost:3001/api/image/proxy?filename=flux__00003_.png&subfolder=&type=output",
  "params": {
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 1024,
    "steps": 4,
    "seed": 123456,
    "sampler": "euler",
    "scheduler": "simple"
  }
}
```

### Generation Status

#### GET /api/status/:id
Get the current status of a generation task.

**Response:**
```json
{
  "id": "generation-uuid",
  "status": "processing",
  "progress": 75,
  "result": null,
  "error": null
}
```

**Status values:**
- `pending` - In queue, not started
- `processing` - Currently generating
- `completed` - Successfully completed
- `error` - Failed with error

### Cancel Generation

#### POST /api/cancel/:id
Cancel an ongoing generation task.

**Response:**
```json
{
  "success": true
}
```

### Queue Management

#### GET /api/queue
Get the current generation queue with all pending, processing, and recent items.

**Response:**
```json
{
  "items": [
    {
      "id": "generation-uuid",
      "prompt": "A beautiful sunset",
      "status": "pending",
      "createdAt": "2025-01-22T12:00:00.000Z",
      "parameters": {
        "width": 1024,
        "height": 1024,
        "steps": 4,
        "seed": 123456
      }
    }
  ]
}
```

#### DELETE /api/queue/:id
Remove an item from the generation queue. Cannot delete items that are currently being processed.

**Response:**
```json
{
  "success": true,
  "message": "Queue item removed successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Cannot delete item that is currently processing"
}
```

### Image Management

#### GET /api/image/proxy
Proxy endpoint to fetch images from ComfyUI with CORS headers.

**Query Parameters:**
- `filename` (required) - Image filename
- `subfolder` (optional) - Subfolder path
- `type` (optional, default: "output") - Image type

**Response:** Image binary data with appropriate content-type header

#### GET /api/image/custom
Serve images from custom user-specified paths.

**Query Parameters:**
- `path` (required) - URL-encoded absolute path to the image file

**Response:** Image binary data with appropriate content-type header

#### DELETE /api/image/:filename
Delete a generated image from ComfyUI output directory or custom location.

**Query Parameters:**
- `subfolder` (optional) - Subfolder path (for ComfyUI images)
- `type` (optional, default: "output") - Image type (for ComfyUI images)
- `customPath` (optional) - URL-encoded path for images in custom locations

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Note:** When `customPath` is provided, the image is deleted from that location instead of ComfyUI's output directory.

### File Upload

#### POST /api/upload
Upload an image file (for future image-to-image features).

**Request:** Multipart form data with field name "image"

**Response:**
```json
{
  "success": true,
  "filename": "unique-filename.png",
  "url": "/uploads/unique-filename.png"
}
```

### Output Configuration

#### GET /api/output-path
Get the current default output path for generated images.

**Response:**
```json
{
  "path": "/media/rese/AL/ComfyUI/output"
}
```

#### POST /api/browse-folder
Validate a folder path for use as output directory.

**Request Body:**
```json
{
  "currentPath": "/path/to/validate"
}
```

**Response:**
```json
{
  "path": "/validated/path"
}
```

**Note:** This endpoint validates that the path exists and is a directory. If the path doesn't exist, it returns the parent directory or default path.

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider adding rate limits to prevent abuse.

## CORS

CORS is enabled for the frontend URL specified in `NEXT_PUBLIC_APP_URL` environment variable (default: `http://localhost:3000`).

---
Last updated: 2025-01-22