#!/usr/bin/env python3
"""
Simple Image Generation GUI using ComfyUI API
Designed for stability and ease of use
"""

import os
import json
import time
import requests
import threading
import queue
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
from PIL import Image, ImageTk
import io
import base64

class ComfyUIImageGenerator:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Simple AI Image Generator")
        self.window.geometry("800x600")
        
        # Set dark theme colors
        self.bg_color = "#2b2b2b"
        self.fg_color = "#ffffff"
        self.button_color = "#4a4a4a"
        self.entry_bg = "#3c3c3c"
        
        self.window.configure(bg=self.bg_color)
        
        # ComfyUI server settings
        self.server_url = "http://127.0.0.1:8188"
        self.client_id = "simple_gui_" + str(int(time.time()))
        
        # Create output directory
        self.output_dir = Path("generated_images")
        self.output_dir.mkdir(exist_ok=True)
        
        # Queue for images
        self.image_queue = queue.Queue()
        
        # Model configurations
        self.models = {
            "Stable Diffusion 1.5": {
                "checkpoint": "v1-5-pruned-emaonly.ckpt",
                "vram": "4-6 GB",
                "resolutions": ["512x512", "768x512", "512x768"],
                "default_res": "512x512",
                "type": "sd15"
            },
            "SDXL Base": {
                "checkpoint": "sd_xl_base_1.0.safetensors",
                "vram": "8-10 GB",
                "resolutions": ["1024x1024", "1152x896", "896x1152", "1216x832", "832x1216"],
                "default_res": "1024x1024",
                "type": "sdxl"
            },
            "OpenJourney": {
                "checkpoint": "openjourney-v4.ckpt",
                "vram": "4-6 GB",
                "resolutions": ["512x512", "768x512", "512x768"],
                "default_res": "512x512",
                "type": "sd15"
            },
            "DreamShaper": {
                "checkpoint": "dreamshaper_8.safetensors",
                "vram": "4-6 GB",
                "resolutions": ["512x512", "768x512", "512x768"],
                "default_res": "512x512",
                "type": "sd15"
            },
            "SD 2.1": {
                "checkpoint": "v2-1_768-ema-pruned.ckpt",
                "vram": "6-8 GB",
                "resolutions": ["768x768", "768x1024", "1024x768"],
                "default_res": "768x768",
                "type": "sd21"
            }
        }
        
        # Current model state
        self.current_model = None
        self.current_resolution = None
        
        # Setup UI
        self.setup_ui()
        
        # Check server status
        self.check_server()
        
        # Start image check loop
        self.window.after(100, self.check_image_queue)
        
    def setup_ui(self):
        """Create the user interface"""
        # Main container
        main_frame = ttk.Frame(self.window, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.window.columnconfigure(0, weight=1)
        self.window.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(3, weight=1)  # Image display row
        
        # Title
        title = tk.Label(main_frame, text="Simple AI Image Generator", 
                        font=("Arial", 16, "bold"),
                        bg=self.bg_color, fg=self.fg_color)
        title.grid(row=0, column=0, columnspan=2, pady=10)
        
        # Model selection frame
        model_frame = ttk.LabelFrame(main_frame, text="Model Selection", padding="10")
        model_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=10)
        
        # Model dropdown
        tk.Label(model_frame, text="Model:", bg=self.bg_color, fg=self.fg_color).grid(row=0, column=0, sticky=tk.W, padx=5)
        self.model_var = tk.StringVar(value="Stable Diffusion 1.5")
        self.model_dropdown = ttk.Combobox(model_frame, textvariable=self.model_var, 
                                          values=list(self.models.keys()), 
                                          state="readonly", width=25)
        self.model_dropdown.grid(row=0, column=1, padx=5)
        self.model_dropdown.bind("<<ComboboxSelected>>", self.on_model_change)
        
        # Resolution dropdown
        tk.Label(model_frame, text="Resolution:", bg=self.bg_color, fg=self.fg_color).grid(row=0, column=2, sticky=tk.W, padx=5)
        self.resolution_var = tk.StringVar()
        self.resolution_dropdown = ttk.Combobox(model_frame, textvariable=self.resolution_var,
                                               state="readonly", width=15)
        self.resolution_dropdown.grid(row=0, column=3, padx=5)
        
        # VRAM info
        self.vram_label = tk.Label(model_frame, text="VRAM: 4-6 GB", 
                                  bg=self.bg_color, fg="#00ccff")
        self.vram_label.grid(row=0, column=4, padx=10)
        
        # Initialize model selection
        self.on_model_change()
        
        # Prompt input
        prompt_label = tk.Label(main_frame, text="Enter your prompt:",
                               bg=self.bg_color, fg=self.fg_color)
        prompt_label.grid(row=2, column=0, sticky=tk.W, pady=5)
        
        self.prompt_text = scrolledtext.ScrolledText(main_frame, height=3, width=50,
                                                    bg=self.entry_bg, fg=self.fg_color,
                                                    insertbackground=self.fg_color)
        self.prompt_text.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
        self.prompt_text.insert(tk.END, "A beautiful sunset over mountains")
        
        # Image display area
        self.image_label = tk.Label(main_frame, text="Your image will appear here",
                                   bg="#1a1a1a", fg=self.fg_color,
                                   width=60, height=30)
        self.image_label.grid(row=3, column=0, columnspan=2, pady=10, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Control buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=4, column=0, columnspan=2, pady=10)
        
        # Generate button
        self.generate_btn = tk.Button(button_frame, text="Generate Image",
                                     command=self.generate_image,
                                     bg=self.button_color, fg=self.fg_color,
                                     width=15, height=2)
        self.generate_btn.grid(row=0, column=0, padx=5)
        
        # Server status
        self.status_label = tk.Label(main_frame, text="Checking server...",
                                    bg=self.bg_color, fg="#ffcc00")
        self.status_label.grid(row=5, column=0, columnspan=2, pady=5)
        
        # Progress bar
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate')
        self.progress.grid(row=6, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
    def on_model_change(self, event=None):
        """Handle model selection change"""
        selected_model = self.model_var.get()
        model_config = self.models[selected_model]
        
        # Update resolution options
        self.resolution_dropdown['values'] = model_config['resolutions']
        self.resolution_var.set(model_config['default_res'])
        
        # Update VRAM info
        self.vram_label.config(text=f"VRAM: {model_config['vram']}")
        
        # Update current model state
        self.current_model = selected_model
        self.current_resolution = model_config['default_res']
        
    def check_server(self):
        """Check if ComfyUI server is running"""
        try:
            response = requests.get(f"{self.server_url}/system_stats", timeout=2)
            if response.status_code == 200:
                self.status_label.config(text="Server connected", fg="#00ff00")
                self.generate_btn.config(state=tk.NORMAL)
            else:
                self.status_label.config(text="Server error", fg="#ff0000")
                self.generate_btn.config(state=tk.DISABLED)
        except:
            self.status_label.config(text="ComfyUI not running. Start with: python ~/ComfyUI/main.py", fg="#ff0000")
            self.generate_btn.config(state=tk.DISABLED)
            
    def generate_image(self):
        """Generate image from prompt"""
        prompt = self.prompt_text.get("1.0", tk.END).strip()
        if not prompt:
            messagebox.showwarning("Warning", "Please enter a prompt")
            return
            
        self.generate_btn.config(state=tk.DISABLED, text="Generating...")
        self.progress.start()
        
        # Generate in thread
        thread = threading.Thread(target=self._generate_thread, args=(prompt,))
        thread.daemon = True
        thread.start()
        
    def _generate_thread(self, prompt):
        """Generate image in background thread"""
        try:
            # Get current model and resolution
            model_config = self.models[self.current_model]
            checkpoint_name = model_config['checkpoint']
            
            # Parse resolution
            width, height = map(int, self.resolution_var.get().split('x'))
            
            # Simple workflow for text to image
            workflow = {
                "3": {
                    "inputs": {
                        "seed": int(time.time()),
                        "steps": 20,
                        "cfg": 8,
                        "sampler_name": "euler",
                        "scheduler": "normal",
                        "denoise": 1,
                        "model": ["4", 0],
                        "positive": ["6", 0],
                        "negative": ["7", 0],
                        "latent_image": ["5", 0]
                    },
                    "class_type": "KSampler"
                },
                "4": {
                    "inputs": {
                        "ckpt_name": checkpoint_name
                    },
                    "class_type": "CheckpointLoaderSimple"
                },
                "5": {
                    "inputs": {
                        "width": width,
                        "height": height,
                        "batch_size": 1
                    },
                    "class_type": "EmptyLatentImage"
                },
                "6": {
                    "inputs": {
                        "text": prompt,
                        "clip": ["4", 1]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "7": {
                    "inputs": {
                        "text": "text, watermark, low quality, blurry",
                        "clip": ["4", 1]
                    },
                    "class_type": "CLIPTextEncode"
                },
                "8": {
                    "inputs": {
                        "samples": ["3", 0],
                        "vae": ["4", 2]
                    },
                    "class_type": "VAEDecode"
                },
                "9": {
                    "inputs": {
                        "filename_prefix": "simple_gui",
                        "images": ["8", 0]
                    },
                    "class_type": "SaveImage"
                }
            }
            
            # Queue prompt
            p = {"prompt": workflow, "client_id": self.client_id}
            response = requests.post(f"{self.server_url}/prompt", json=p)
            
            if response.status_code == 200:
                prompt_id = response.json()['prompt_id']
                
                # Wait for completion
                while True:
                    history = requests.get(f"{self.server_url}/history/{prompt_id}").json()
                    if prompt_id in history:
                        if history[prompt_id].get('outputs', {}).get('9', {}).get('images'):
                            # Get the image
                            image_data = history[prompt_id]['outputs']['9']['images'][0]
                            filename = image_data['filename']
                            
                            # Download image
                            image_response = requests.get(f"{self.server_url}/view", 
                                                        params={"filename": filename})
                            
                            if image_response.status_code == 200:
                                # Save and display
                                image = Image.open(io.BytesIO(image_response.content))
                                
                                # Save to disk
                                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                save_path = self.output_dir / f"generated_{timestamp}.png"
                                image.save(save_path)
                                
                                # Queue for display
                                self.image_queue.put((image, save_path))
                            break
                    time.sleep(0.5)
            else:
                self.window.after(0, lambda: messagebox.showerror("Error", "Failed to queue prompt"))
                
        except Exception as e:
            self.window.after(0, lambda: messagebox.showerror("Error", f"Generation failed: {str(e)}"))
        finally:
            self.window.after(0, self._generation_complete)
            
    def _generation_complete(self):
        """Reset UI after generation"""
        self.generate_btn.config(state=tk.NORMAL, text="Generate Image")
        self.progress.stop()
        
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
        """Display the generated image"""
        # Resize to fit display
        display_size = (500, 500)
        image.thumbnail(display_size, Image.Resampling.LANCZOS)
        
        # Convert to PhotoImage
        photo = ImageTk.PhotoImage(image)
        
        # Update label
        self.image_label.config(image=photo, text="")
        self.image_label.image = photo  # Keep reference
        
        self.status_label.config(text=f"Image saved: {filepath.name}", fg="#00ff00")
        
    def run(self):
        """Start the application"""
        self.window.mainloop()

if __name__ == "__main__":
    print("Starting Simple AI Image Generator...")
    print("Make sure ComfyUI is running: python ~/ComfyUI/main.py")
    app = ComfyUIImageGenerator()
    app.run()