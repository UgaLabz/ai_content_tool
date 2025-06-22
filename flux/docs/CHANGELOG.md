# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0] - 2025-06-22

### Added
- **Character Consistency Planning**
  - Comprehensive technical plan for character consistency features
  - Detailed development checklist with 4 implementation phases
  - LoRA training pipeline architecture design
  - IP-Adapter integration planning for image prompting
  - Database schema for character management
  - ComfyUI workflow templates for character generation

### Fixed
- **Security Issues**
  - Replaced hardcoded Hugging Face token with environment variable
  - Updated download_models_auth.sh to use HUGGING_FACE_TOKEN env var
  
### Changed
- **Repository Structure**
  - Added comprehensive .gitignore at repository root level
  - Fixed issue with 10k+ tracked files in git
  - Created clean branch (todd-clean) to resolve git history issues

### Improved
- **UI Enhancements**
  - All UI components now have comprehensive tooltips
  - Removed "Try these suggestions" section from prompt input
  - Fixed image URLs to use full server paths

## [0.4.2] - 2025-06-22

### Fixed
- **Image Gallery Issues**
  - Fixed existing images not loading from output folder on page load
  - Added new ExistingImages component to display images from disk
  - Fixed folder selector button that was non-functional
  - Added proper tooltip explaining folder browsing limitation in web apps

### Added
- **Image Management Features**
  - New API endpoint `/api/images` to list images from output folder
  - ExistingImages component with grid view of existing images
  - Refresh button to reload images from disk
  - File size display for each image
  - Support for viewing images from custom output paths

### Changed
- **UI Improvements**
  - Reorganized generate page to show both in-memory and disk images
  - Added generation queue component to main view
  - Improved error handling for missing directories
  - Limited image listing to 50 most recent files for performance

## [0.4.1] - 2025-06-22

### Removed
- **Model Cleanup**
  - Removed all Kandinsky 2.2 and 3 models (81GB total)
  - Removed Kandinsky ComfyUI custom node integration
  - Removed Diffusers ComfyUI custom node (not used by Flux)
  - Cleaned up ComfyUI configuration to remove Kandinsky paths
  - Freed up 81GB of storage space on /media/rese/AL drive

### Changed
- **System Optimization**
  - ComfyUI now configured exclusively for Flux models
  - Simplified model management with single image generation framework
  - Updated extra_model_paths.yaml to remove unused model paths

## [0.4.0] - 2025-06-22

### Added
- **Queue Management Features**
  - Generation queue component showing all active and recent generations
  - Delete functionality for queue items (except those currently processing)
  - Visual queue status indicators with tooltips
  - Real-time queue updates via WebSocket events
  - Queue API endpoints for fetching and deleting queue items
  
- **Enhanced UI Tooltips**
  - Added comprehensive tooltips to all UI components
  - Parameter controls now include detailed explanations for each setting
  - Output settings tooltips explain path and filename options
  - Queue item status tooltips describe each generation state
  - Added @radix-ui/react-tooltip for consistent tooltip implementation

- **UI/UX Improvements**
  - Added visual feedback for processing items in queue
  - Improved button hover states and disabled states
  - Added info icons next to labels for better discoverability
  - Enhanced sampler and scheduler dropdowns with descriptions

### Changed
- **Component Updates**
  - Updated parameter-controls.tsx with TooltipProvider wrapper
  - Enhanced output-settings.tsx with contextual tooltips
  - Modified generation-queue.tsx to support delete functionality
  - Added proper TypeScript types for queue management

### Fixed
- Queue item cleanup timing for completed/failed generations
- Tooltip positioning for better visibility
- Button click areas for improved mobile experience

## [0.3.0] - 2025-01-22

### Added
- **User Interface Enhancements**
  - Comprehensive tooltips for all generation parameters
  - Detailed descriptions for each sampler and scheduler option
  - Delete functionality for individual generated images
  - Delete button with visual feedback in image gallery
  - Output settings card for configuring save location and filename
  - Custom filename override option for generated images
  - Folder path input with browse and reset functionality

- **Backend Features**
  - Image deletion API endpoint (`DELETE /api/image/:filename`)
  - Support for deleting images from ComfyUI output directory
  - Output path configuration endpoint (`GET /api/output-path`)
  - Folder browsing endpoint (`POST /api/browse-folder`)
  - Custom filename support in workflow generation
  - Automatic filename generation from prompt when not overridden

### Changed
- **Code Cleanup**
  - Removed all debug console.log statements
  - Fixed import path for toast hook in toaster component
  - Enhanced parameter controls with informative tooltips
  - Updated image gallery with delete functionality
  - Workflow template now uses dynamic filename prefix

### Removed
- **Unnecessary Files**
  - Duplicate `use-toast.ts` hook file
  - Unused test scripts (`test-simple.ts`, `test-flux-direct.ts`)
  - Old planning notes (`note.md`)
  - Empty directories (`docs/plans`, `src/types`, `src/components/hooks`)
  - Temporary log files (`*.log`)

### Fixed
- CORS issues with image proxy endpoint
- Next.js deprecation warning for image domains configuration
- TypeScript errors in Express route handlers

### Implementation Details
- **File Management**: When a custom output path is specified:
  - ComfyUI generates the image in its default location
  - The application automatically moves the file to the user's specified directory
  - The original file in ComfyUI's output folder is deleted to avoid duplicates
  - If no custom path is specified, images remain in ComfyUI's default location

## [0.2.0] - 2025-01-22

### Fixed
- **Backend Integration Issues**
  - Fixed workflow template parsing error that prevented image generation
  - Resolved ComfyUI broken pipe errors during VAE decoding
  - Extended generation timeout from 2 to 10 minutes for Flux models
  - Added proper WebSocket message handling for all ComfyUI events

### Added
- **Documentation Updates**
  - Complete startup guide with ComfyUI proper initialization
  - Comprehensive troubleshooting guide for common issues
  - Detailed ComfyUI integration documentation
  - Debug commands and emergency recovery procedures

### Changed
- **Backend Improvements**
  - Enhanced ComfyUI client with better error handling
  - Improved WebSocket message logging for debugging
  - Updated workflow template processing logic

## [0.1.0] - 2024-12-21

### Added
- Initial release
- Basic Flux Schnell integration via ComfyUI
- Next.js frontend with image generation interface
- Express backend with Socket.io for real-time updates
- ComfyUI workflow template support

---

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)