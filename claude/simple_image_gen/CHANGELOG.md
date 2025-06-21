# Changelog

All notable changes to the Simple AI Image Generator will be documented in this file.

## [0.2.0] - 2025-06-21

### Phase 1: Multi-Model Support

#### Added
- Model selection dropdown with support for multiple Stable Diffusion models:
  - Stable Diffusion 1.5
  - SDXL Base
  - OpenJourney
  - DreamShaper
  - SD 2.1
- Dynamic resolution selector that updates based on selected model
- VRAM requirement display for each model
- Model configuration system with proper checkpoint mapping
- Test script for validating model selection functionality

#### Changed
- Updated GUI layout to accommodate model selection controls
- Modified workflow generation to use selected model and resolution
- Enhanced documentation with model comparison table

#### Technical Details
- Added `models` dictionary containing model configurations
- Implemented `on_model_change()` callback for model switching
- Updated `_generate_thread()` to use dynamic model and resolution values
- Refactored grid layout to support new UI elements

## [0.1.0] - 2025-06-21

### Initial Release
- Basic GUI for image generation using ComfyUI
- Single model support (SD 1.5)
- Fixed resolution (512x512)
- Simple prompt input and generation