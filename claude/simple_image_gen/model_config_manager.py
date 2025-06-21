#!/usr/bin/env python3
"""
Model Configuration Manager for Simple Image Generator
Handles loading, validation, and management of model configurations
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class ModelConfigManager:
    def __init__(self, config_path: str = "model_configs.json"):
        """Initialize the configuration manager"""
        self.config_path = Path(config_path)
        self.configs = {}
        self.load_configurations()
        
    def load_configurations(self):
        """Load model configurations from JSON file"""
        try:
            if not self.config_path.exists():
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
                
            with open(self.config_path, 'r') as f:
                self.configs = json.load(f)
                
            logger.info(f"Loaded {len(self.configs['models'])} model configurations")
            
        except Exception as e:
            logger.error(f"Failed to load configurations: {e}")
            raise
            
    def get_model_config(self, model_id: str) -> Dict:
        """Get configuration for a specific model"""
        if model_id not in self.configs['models']:
            raise ValueError(f"Model '{model_id}' not found in configurations")
        return self.configs['models'][model_id]
        
    def get_available_models(self) -> List[Dict]:
        """Get list of all available models with basic info"""
        models = []
        for model_id, config in self.configs['models'].items():
            models.append({
                'id': model_id,
                'display_name': config['display_name'],
                'type': config['type'],
                'vram_min': config['vram_requirements']['minimum']
            })
        return models
        
    def get_model_by_display_name(self, display_name: str) -> Optional[Dict]:
        """Find model configuration by display name"""
        for model_id, config in self.configs['models'].items():
            if config['display_name'] == display_name:
                return config
        return None
        
    def get_checkpoint_path(self, model_id: str) -> Optional[str]:
        """Find the first available checkpoint file for a model"""
        config = self.get_model_config(model_id)
        checkpoint_dir = Path(self.configs['model_paths']['checkpoints']).expanduser()
        
        for checkpoint_file in config['checkpoint_files']:
            checkpoint_path = checkpoint_dir / checkpoint_file
            if checkpoint_path.exists():
                return checkpoint_file
                
        logger.warning(f"No checkpoint found for {model_id}")
        return None
        
    def validate_model_installation(self, model_id: str) -> Dict:
        """Validate if a model is properly installed"""
        config = self.get_model_config(model_id)
        result = {
            'installed': False,
            'checkpoint_found': None,
            'vae_found': None,
            'missing_files': []
        }
        
        # Check checkpoint
        checkpoint_path = self.get_checkpoint_path(model_id)
        if checkpoint_path:
            result['checkpoint_found'] = checkpoint_path
            result['installed'] = True
        else:
            result['missing_files'].extend(config['checkpoint_files'])
            
        # Check VAE if required
        if config.get('vae_files'):
            vae_dir = Path(self.configs['model_paths']['vae']).expanduser()
            for vae_file in config['vae_files']:
                if (vae_dir / vae_file).exists():
                    result['vae_found'] = vae_file
                    break
            else:
                result['missing_files'].extend(config['vae_files'])
                
        return result
        
    def get_optimal_resolution(self, model_id: str, aspect_ratio: str = 'square') -> str:
        """Get optimal resolution for a model based on aspect ratio"""
        config = self.get_model_config(model_id)
        resolutions = config['resolutions']
        
        if aspect_ratio in resolutions and resolutions[aspect_ratio]:
            return resolutions[aspect_ratio][0]
        return resolutions['default']
        
    def get_workflow_template(self, model_type: str) -> Optional[str]:
        """Get workflow template path for a model type"""
        if model_type in self.configs['workflow_templates']:
            return self.configs['workflow_templates'][model_type]
        return None
        
    def estimate_generation_time(self, model_id: str, steps: int) -> int:
        """Estimate generation time in seconds"""
        base_times = {
            'sd15': 0.5,
            'sd21': 0.7,
            'sdxl': 1.2,
            'kandinsky': 1.0,
            'deepfloyd': 2.0
        }
        
        config = self.get_model_config(model_id)
        model_type = config['type']
        base_time = base_times.get(model_type, 0.8)
        
        return int(base_time * steps)
        
    def get_download_info(self, model_id: str) -> Dict:
        """Get download information for a model"""
        download_info = {
            'huggingface': None,
            'civitai': None,
            'direct_links': []
        }
        
        if model_id in self.configs['download_sources']['huggingface']:
            download_info['huggingface'] = self.configs['download_sources']['huggingface'][model_id]
            
        if model_id in self.configs['download_sources']['civitai']:
            download_info['civitai'] = self.configs['download_sources']['civitai'][model_id]
            
        return download_info
        
    def check_vram_compatibility(self, model_id: str, available_vram: int) -> str:
        """Check if model is compatible with available VRAM"""
        config = self.get_model_config(model_id)
        vram_req = config['vram_requirements']
        
        if available_vram < vram_req['minimum']:
            return 'incompatible'
        elif available_vram < vram_req['recommended']:
            return 'limited'
        elif available_vram < vram_req['optimal']:
            return 'good'
        else:
            return 'optimal'
            
    def get_all_resolutions(self, model_id: str) -> List[str]:
        """Get all available resolutions for a model"""
        config = self.get_model_config(model_id)
        all_resolutions = []
        
        for category in ['square', 'landscape', 'portrait']:
            if category in config['resolutions']:
                all_resolutions.extend(config['resolutions'][category])
                
        # Remove duplicates while preserving order
        seen = set()
        unique_resolutions = []
        for res in all_resolutions:
            if res not in seen:
                seen.add(res)
                unique_resolutions.append(res)
                
        return unique_resolutions

# Example usage and testing
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Test the configuration manager
    manager = ModelConfigManager()
    
    print("Available Models:")
    for model in manager.get_available_models():
        print(f"  - {model['display_name']} (Min VRAM: {model['vram_min']}GB)")
        
    # Test model validation
    print("\nModel Installation Status:")
    for model_id in ['stable-diffusion-15', 'sdxl', 'openjourney']:
        validation = manager.validate_model_installation(model_id)
        status = "✓ Installed" if validation['installed'] else "✗ Not Installed"
        print(f"  {model_id}: {status}")
        if validation['missing_files']:
            print(f"    Missing: {', '.join(validation['missing_files'][:2])}...")
            
    # Test resolution retrieval
    print("\nOptimal Resolutions:")
    print(f"  SD 1.5 Square: {manager.get_optimal_resolution('stable-diffusion-15', 'square')}")
    print(f"  SDXL Landscape: {manager.get_optimal_resolution('sdxl', 'landscape')}")