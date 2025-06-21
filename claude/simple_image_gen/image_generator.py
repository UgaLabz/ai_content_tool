#!/usr/bin/env python3
"""
Simple Image Generation GUI using Stable Diffusion
Designed for AMD GPU compatibility
"""

import os
import sys
import threading
import queue
from datetime import datetime
from pathlib import Path
import customtkinter as ctk
from PIL import Image, ImageTk
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

# Set appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class ImageGeneratorApp:
    def __init__(self):
        self.window = ctk.CTk()
        self.window.title("AI Image Generator")
        self.window.geometry("900x700")
        
        # Create output directory
        self.output_dir = Path("generated_images")
        self.output_dir.mkdir(exist_ok=True)
        
        # Queue for thread communication
        self.image_queue = queue.Queue()
        
        # Model state
        self.pipeline = None
        self.is_generating = False
        
        # Setup UI
        self.setup_ui()
        
        # Check for AMD GPU
        self.check_gpu()
        
        # Start image display thread
        self.window.after(100, self.check_image_queue)
        
    def check_gpu(self):
        """Check GPU availability and type"""
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            self.status_label.configure(text=f"GPU: {gpu_name}")
            self.device = "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            self.status_label.configure(text="GPU: Apple Silicon")
            self.device = "mps"
        else:
            # Check for ROCm (AMD)
            try:
                import subprocess
                result = subprocess.run(['rocm-smi'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.status_label.configure(text="GPU: AMD ROCm detected")
                    self.device = "cuda"  # ROCm uses cuda interface
                else:
                    self.status_label.configure(text="No GPU detected - Using CPU (slow)")
                    self.device = "cpu"
            except:
                self.status_label.configure(text="No GPU detected - Using CPU (slow)")
                self.device = "cpu"
    
    def setup_ui(self):
        """Create the user interface"""
        # Main container
        main_frame = ctk.CTkFrame(self.window)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Left panel for controls
        control_frame = ctk.CTkFrame(main_frame)
        control_frame.pack(side="left", fill="y", padx=(0, 10))
        
        # Title
        title = ctk.CTkLabel(control_frame, text="AI Image Generator", 
                           font=ctk.CTkFont(size=24, weight="bold"))
        title.pack(pady=10)
        
        # Model selection
        model_label = ctk.CTkLabel(control_frame, text="Model:")
        model_label.pack(pady=(20, 5))
        
        self.model_var = ctk.StringVar(value="runwayml/stable-diffusion-v1-5")
        model_menu = ctk.CTkOptionMenu(
            control_frame,
            variable=self.model_var,
            values=[
                "runwayml/stable-diffusion-v1-5",
                "stabilityai/stable-diffusion-2-1",
                "CompVis/stable-diffusion-v1-4",
                "prompthero/openjourney"
            ],
            width=250
        )
        model_menu.pack(pady=5)
        
        # Load model button
        self.load_button = ctk.CTkButton(
            control_frame,
            text="Load Model",
            command=self.load_model,
            width=250
        )
        self.load_button.pack(pady=10)
        
        # Prompt input
        prompt_label = ctk.CTkLabel(control_frame, text="Prompt:")
        prompt_label.pack(pady=(20, 5))
        
        self.prompt_text = ctk.CTkTextbox(control_frame, height=100, width=250)
        self.prompt_text.pack(pady=5)
        self.prompt_text.insert("0.0", "A beautiful landscape with mountains")
        
        # Negative prompt
        neg_label = ctk.CTkLabel(control_frame, text="Negative Prompt:")
        neg_label.pack(pady=(10, 5))
        
        self.negative_text = ctk.CTkTextbox(control_frame, height=60, width=250)
        self.negative_text.pack(pady=5)
        self.negative_text.insert("0.0", "blurry, bad quality, distorted")
        
        # Generation settings
        settings_label = ctk.CTkLabel(control_frame, text="Settings", 
                                    font=ctk.CTkFont(weight="bold"))
        settings_label.pack(pady=(20, 10))
        
        # Steps
        steps_frame = ctk.CTkFrame(control_frame)
        steps_frame.pack(pady=5, fill="x", padx=20)
        ctk.CTkLabel(steps_frame, text="Steps:").pack(side="left")
        self.steps_var = ctk.IntVar(value=20)
        steps_slider = ctk.CTkSlider(steps_frame, from_=10, to=50, 
                                   variable=self.steps_var, width=100)
        steps_slider.pack(side="left", padx=10)
        self.steps_label = ctk.CTkLabel(steps_frame, text="20")
        self.steps_label.pack(side="left")
        steps_slider.configure(command=lambda v: self.steps_label.configure(text=str(int(v))))
        
        # Guidance scale
        guidance_frame = ctk.CTkFrame(control_frame)
        guidance_frame.pack(pady=5, fill="x", padx=20)
        ctk.CTkLabel(guidance_frame, text="Guidance:").pack(side="left")
        self.guidance_var = ctk.DoubleVar(value=7.5)
        guidance_slider = ctk.CTkSlider(guidance_frame, from_=1, to=20, 
                                      variable=self.guidance_var, width=100)
        guidance_slider.pack(side="left", padx=10)
        self.guidance_label = ctk.CTkLabel(guidance_frame, text="7.5")
        self.guidance_label.pack(side="left")
        guidance_slider.configure(command=lambda v: self.guidance_label.configure(text=f"{float(v):.1f}"))
        
        # Generate button
        self.generate_button = ctk.CTkButton(
            control_frame,
            text="Generate Image",
            command=self.generate_image,
            width=250,
            height=40,
            state="disabled"
        )
        self.generate_button.pack(pady=20)
        
        # Status label
        self.status_label = ctk.CTkLabel(control_frame, text="Model not loaded")
        self.status_label.pack(pady=10)
        
        # Right panel for image display
        image_frame = ctk.CTkFrame(main_frame)
        image_frame.pack(side="right", fill="both", expand=True)
        
        # Image display
        self.image_label = ctk.CTkLabel(image_frame, text="Generated image will appear here")
        self.image_label.pack(expand=True, fill="both", padx=20, pady=20)
        
        # Progress bar
        self.progress = ctk.CTkProgressBar(image_frame)
        self.progress.pack(pady=10, padx=20, fill="x")
        self.progress.set(0)
        
    def load_model(self):
        """Load the selected model"""
        self.load_button.configure(state="disabled", text="Loading...")
        self.status_label.configure(text="Loading model... This may take a few minutes")
        
        # Load in thread to prevent UI freeze
        thread = threading.Thread(target=self._load_model_thread)
        thread.daemon = True
        thread.start()
        
    def _load_model_thread(self):
        """Load model in background thread"""
        try:
            model_id = self.model_var.get()
            
            # Load pipeline with optimizations
            self.pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if self.device != "cpu" else torch.float32,
                safety_checker=None,  # Disable for performance
                requires_safety_checker=False
            )
            
            # Move to device
            self.pipeline = self.pipeline.to(self.device)
            
            # Use faster scheduler
            self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(
                self.pipeline.scheduler.config
            )
            
            # Enable memory efficient attention if available
            if self.device != "cpu":
                try:
                    self.pipeline.enable_attention_slicing()
                except:
                    pass
            
            # Update UI in main thread
            self.window.after(0, self._model_loaded)
            
        except Exception as e:
            self.window.after(0, lambda: self._model_load_failed(str(e)))
    
    def _model_loaded(self):
        """Update UI after model loads"""
        self.load_button.configure(state="normal", text="Load Model")
        self.generate_button.configure(state="normal")
        self.status_label.configure(text=f"Model loaded on {self.device.upper()}")
        
    def _model_load_failed(self, error):
        """Handle model load failure"""
        self.load_button.configure(state="normal", text="Load Model")
        self.status_label.configure(text=f"Failed to load model: {error}")
        
    def generate_image(self):
        """Generate image from prompt"""
        if self.is_generating or self.pipeline is None:
            return
            
        self.is_generating = True
        self.generate_button.configure(state="disabled", text="Generating...")
        self.progress.set(0)
        
        # Get parameters
        prompt = self.prompt_text.get("0.0", "end").strip()
        negative_prompt = self.negative_text.get("0.0", "end").strip()
        steps = self.steps_var.get()
        guidance = self.guidance_var.get()
        
        # Generate in thread
        thread = threading.Thread(
            target=self._generate_thread,
            args=(prompt, negative_prompt, steps, guidance)
        )
        thread.daemon = True
        thread.start()
        
    def _generate_thread(self, prompt, negative_prompt, steps, guidance):
        """Generate image in background thread"""
        try:
            # Progress callback
            def progress_callback(step, timestep, latents):
                progress = step / steps
                self.window.after(0, lambda: self.progress.set(progress))
            
            # Generate image
            with torch.no_grad():
                if self.device == "cpu":
                    # CPU generation - use autocast for better performance
                    with torch.autocast("cpu"):
                        image = self.pipeline(
                            prompt=prompt,
                            negative_prompt=negative_prompt,
                            num_inference_steps=steps,
                            guidance_scale=guidance,
                            callback=progress_callback,
                            callback_steps=1
                        ).images[0]
                else:
                    # GPU generation
                    image = self.pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        num_inference_steps=steps,
                        guidance_scale=guidance,
                        callback=progress_callback,
                        callback_steps=1
                    ).images[0]
            
            # Save image
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"generated_{timestamp}.png"
            filepath = self.output_dir / filename
            image.save(filepath)
            
            # Queue image for display
            self.image_queue.put((image, filepath))
            
        except Exception as e:
            self.window.after(0, lambda: self._generation_failed(str(e)))
        finally:
            self.window.after(0, self._generation_complete)
    
    def _generation_complete(self):
        """Reset UI after generation"""
        self.is_generating = False
        self.generate_button.configure(state="normal", text="Generate Image")
        self.progress.set(1)
        
    def _generation_failed(self, error):
        """Handle generation failure"""
        self.status_label.configure(text=f"Generation failed: {error}")
        
    def check_image_queue(self):
        """Check for new images to display"""
        try:
            while True:
                image, filepath = self.image_queue.get_nowait()
                self.display_image(image, filepath)
        except queue.Empty:
            pass
        finally:
            self.window.after(100, self.check_image_queue)
    
    def display_image(self, image, filepath):
        """Display generated image"""
        # Resize for display
        display_size = (512, 512)
        image_display = image.resize(display_size, Image.Resampling.LANCZOS)
        
        # Convert to PhotoImage
        photo = ctk.CTkImage(light_image=image_display, dark_image=image_display, 
                           size=display_size)
        
        # Update label
        self.image_label.configure(image=photo, text="")
        self.status_label.configure(text=f"Image saved: {filepath.name}")
        
    def run(self):
        """Start the application"""
        self.window.mainloop()

if __name__ == "__main__":
    app = ImageGeneratorApp()
    app.run()