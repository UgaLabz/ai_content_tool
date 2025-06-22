# Changelog

All notable changes to this project will be documented in this file.

## [0.10.0] - 2025-06-22

### Added
- **Character Image Gallery System**
  - Comprehensive character detail view with image management
  - Multi-image upload dialog with drag-and-drop support
  - Grid and list view modes for character images
  - Primary image selection functionality
  - Full-size image viewer with metadata display
  - Image deletion with confirmation
  - Generation history display for each character
  - View details button in character list

### Changed
- Character page now supports detail view navigation
- Character images are properly displayed with thumbnails
- Added tooltips for all image gallery actions

### Technical
- Created CharacterDetail, CharacterImageGrid, and ImageUploadDialog components
- Added GenerationHistoryComponent to show past generations
- Implemented proper image URL handling for uploaded files
- Support for up to 10MB image uploads with validation

## [0.9.0] - 2025-06-22

### Added
- **LoRA Training Pipeline (Phase 4 - Partial)**
  - Dataset builder interface for preparing training images
  - Training configuration UI with basic and advanced settings
  - Database schema for training jobs and dataset management
  - Training service integration with kohya_ss
  - Real-time training progress updates via WebSocket
  - Training dialog integrated into character management
  - API endpoints for creating and managing training jobs
  - Support for custom caption editing per image
  - Training job status tracking and cancellation

### Technical
- Added `lora_training_jobs` and `training_dataset_images` tables
- Created comprehensive training configuration options
- Implemented dataset validation (5-100 images)
- Socket events for training progress, completion, and errors
- Training service uses subprocess for kohya_ss integration

### Notes
- LoRA training requires kohya_ss to be installed at `/media/rese/AL/kohya_ss`
- Training runs on GPU 0 by default
- Output LoRAs are saved to `/media/rese/AL/models/loras/trained/{character_id}/`

## [0.8.0] - 2025-06-22

### Added
- **IP-Adapter Integration (Phase 3)**
  - IP-Adapter workflow template for image-guided generation
  - Reference image upload component with mode selection
  - Support for style transfer, character reference, and composition modes
  - Adjustable strength and application range (start/end percentages)
  - Character image selector for using character references
  - Image upload endpoint with validation

### Changed
- ComfyUI client now supports three workflow types (standard, LoRA, IP-Adapter)
- Generate endpoint handles reference image configuration
- Generate page includes reference image upload interface
- Workflow selection is now based on features used (prioritizes IP-Adapter)

### Technical
- IP-Adapter workflow uses CLIP vision encoder for image understanding
- Support for different reference modes with prompt adjustments
- Proper image path handling for ComfyUI compatibility

## [0.7.0] - 2025-06-22

### Added
- **LoRA Integration (Phase 2)**
  - LoRA workflow template for ComfyUI
  - LoRA model scanner service to discover models in /media/rese/AL
  - LoRA selector component with scan functionality
  - Character-based generation with automatic LoRA loading
  - Negative prompt support for character generation
  - Generation history tracking with character association
  - API endpoint to scan and catalog LoRA models

### Changed
- Updated ComfyUI client to support LoRA workflows
- Enhanced generate endpoint to handle character-based generation
- Modified generate page to show selected character
- Character dialog now uses LoRA selector instead of manual path input

### Technical
- Created separate workflow templates for standard and LoRA generation
- Implemented automatic LoRA file discovery and validation
- Added proper prompt merging for character + user prompts

## [0.6.0] - 2025-06-22

### Added
- **Character Management System (Phase 1)**
  - SQLite database with comprehensive schema for character data
  - Full CRUD API endpoints for character management
  - Character list UI with create, edit, and delete functionality
  - Character creation dialog with detailed form fields
  - Support for LoRA model paths and strength settings
  - Character tagging system for organization
  - Primary image selection for characters
  - Generation history tracking per character
  - Style preset support for characters
  - Navigation menu with Characters section

### Changed
- Updated main layout with navigation between Generate and Characters pages
- Enhanced API client with character management methods
- Fixed .gitignore to properly exclude AI model files but not source code models

### Technical
- Integrated Knex.js for database management
- Added SQLite3 for local data persistence
- Created comprehensive TypeScript types for character system
- Implemented proper database initialization and cleanup

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