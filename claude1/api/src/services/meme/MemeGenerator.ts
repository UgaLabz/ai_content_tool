import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs/promises';

export interface MemeTemplate {
  name: string;
  imageUrl: string;
  textAreas: {
    top?: { x: number; y: number; width: number; height: number };
    bottom?: { x: number; y: number; width: number; height: number };
    custom?: Array<{ x: number; y: number; width: number; height: number }>;
  };
}

export interface MemeGenerationRequest {
  template: string;
  topText?: string;
  bottomText?: string;
  customTexts?: string[];
}

export class MemeGenerator {
  private templates: Map<string, MemeTemplate> = new Map();
  private outputDir: string;

  constructor(outputDir: string = './generated-memes') {
    this.outputDir = outputDir;
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Define popular meme templates
    this.templates.set('drake', {
      name: 'Drake',
      imageUrl: 'https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg',
      textAreas: {
        custom: [
          { x: 350, y: 100, width: 300, height: 250 }, // Top panel
          { x: 350, y: 400, width: 300, height: 250 }  // Bottom panel
        ]
      }
    });

    this.templates.set('distracted-boyfriend', {
      name: 'Distracted Boyfriend',
      imageUrl: 'https://imgflip.com/s/meme/Distracted-Boyfriend.jpg',
      textAreas: {
        custom: [
          { x: 100, y: 300, width: 200, height: 100 },  // Girlfriend
          { x: 400, y: 200, width: 200, height: 100 },  // Other woman
          { x: 250, y: 100, width: 200, height: 100 }   // Boyfriend
        ]
      }
    });

    this.templates.set('woman-yelling-cat', {
      name: 'Woman Yelling at Cat',
      imageUrl: 'https://imgflip.com/s/meme/Woman-Yelling-At-Cat.jpg',
      textAreas: {
        custom: [
          { x: 100, y: 50, width: 300, height: 200 },   // Woman side
          { x: 500, y: 50, width: 300, height: 200 }    // Cat side
        ]
      }
    });

    // Default template for simple top/bottom text memes
    this.templates.set('default', {
      name: 'Default',
      imageUrl: '', // Will use a blank canvas
      textAreas: {
        top: { x: 50, y: 20, width: 400, height: 80 },
        bottom: { x: 50, y: 320, width: 400, height: 80 }
      }
    });
  }

  async generateMeme(request: MemeGenerationRequest): Promise<string> {
    const template = this.templates.get(request.template.toLowerCase()) || this.templates.get('default')!;
    
    // Create canvas
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Fill with white background for now (in production, load actual template images)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);

    // Add template name as placeholder
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[${template.name} Template]`, 400, 300);

    // Configure text style
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.font = 'bold 36px Impact, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add top text
    if (request.topText && template.textAreas.top) {
      const area = template.textAreas.top;
      this.drawText(ctx, request.topText, area.x + area.width / 2, area.y + area.height / 2);
    }

    // Add bottom text
    if (request.bottomText && template.textAreas.bottom) {
      const area = template.textAreas.bottom;
      this.drawText(ctx, request.bottomText, area.x + area.width / 2, area.y + area.height / 2);
    }

    // Add custom texts for multi-panel memes
    if (request.customTexts && template.textAreas.custom) {
      request.customTexts.forEach((text, index) => {
        if (template.textAreas.custom && template.textAreas.custom[index]) {
          const area = template.textAreas.custom[index];
          ctx.font = 'bold 24px Arial'; // Smaller font for panels
          this.drawText(ctx, text, area.x + area.width / 2, area.y + area.height / 2);
        }
      });
    }

    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    // Save the image
    const filename = `meme-${Date.now()}.png`;
    const filepath = path.join(this.outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    // Draw text with white outline
    ctx.strokeText(text.toUpperCase(), x, y);
    ctx.fillText(text.toUpperCase(), x, y);
  }

  async generateFromLLMResponse(llmResponse: string, template: string = 'default'): Promise<string> {
    // Parse LLM response to extract meme text
    const lines = llmResponse.split('\n').filter(line => line.trim());
    
    let topText = '';
    let bottomText = '';
    let customTexts: string[] = [];

    // Look for marked sections in the response
    const topMatch = llmResponse.match(/\*\*Top.*?:\*\*\s*(.+?)(?:\n|$)/i);
    const bottomMatch = llmResponse.match(/\*\*Bottom.*?:\*\*\s*(.+?)(?:\n|$)/i);

    if (topMatch) topText = topMatch[1].trim();
    if (bottomMatch) bottomText = bottomMatch[1].trim();

    // For templates with custom areas, extract all quoted text
    if (template.toLowerCase() === 'drake' || template.toLowerCase() === 'distracted-boyfriend') {
      const quotedTexts = llmResponse.match(/"([^"]+)"/g);
      if (quotedTexts) {
        customTexts = quotedTexts.map(t => t.replace(/"/g, ''));
      }
    }

    // If no structured format found, use simple split
    if (!topText && !bottomText && customTexts.length === 0) {
      const relevantLines = lines.filter(line => 
        !line.toLowerCase().includes('here') && 
        !line.toLowerCase().includes('meme') &&
        line.length > 5
      );
      
      if (relevantLines.length >= 2) {
        topText = relevantLines[0];
        bottomText = relevantLines[1];
      } else if (relevantLines.length === 1) {
        topText = relevantLines[0];
      }
    }

    return this.generateMeme({
      template,
      topText,
      bottomText,
      customTexts
    });
  }
}