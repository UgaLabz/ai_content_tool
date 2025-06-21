import { 
  CharacterProfile, 
  CharacterContext, 
  PersonalityTraits, 
  CharacterMemory, 
  CharacterBackground, 
  VoiceStyle, 
  KnowledgeDomain 
} from '../../models/character';
import { logger } from '../../utils/logger';

export interface PromptTemplate {
  id: string;
  name: string;
  modelPattern: string; // Regex pattern to match model names
  template: string;
  variables: string[];
  requirements: {
    minContextWindow: number;
    supportsSystemPrompt: boolean;
    supportsFunctions?: boolean;
  };
}

export interface PromptGenerationOptions {
  includeMemories?: boolean;
  memoryCount?: number;
  includePersonality?: boolean;
  includeBackground?: boolean;
  includeRelationships?: boolean;
  style?: 'detailed' | 'concise' | 'balanced';
}

export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();
  
  constructor() {
    this.initializeDefaultTemplates();
  }
  
  private initializeDefaultTemplates(): void {
    // Llama-style template
    this.templates.set('llama', {
      id: 'llama',
      name: 'Llama Models',
      modelPattern: 'llama|alpaca|vicuna',
      template: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{system_prompt}<|eot_id|>
{memory_context}
<|start_header_id|>user<|end_header_id|>
{user_prompt}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>`,
      variables: ['system_prompt', 'memory_context', 'user_prompt'],
      requirements: {
        minContextWindow: 4096,
        supportsSystemPrompt: true,
      },
    });
    
    // ChatML template (GPT, many open models)
    this.templates.set('chatml', {
      id: 'chatml',
      name: 'ChatML Format',
      modelPattern: 'gpt|openai|chatgpt|mixtral|dolphin',
      template: `<|im_start|>system
{system_prompt}<|im_end|>
{memory_context}
<|im_start|>user
{user_prompt}<|im_end|>
<|im_start|>assistant
`,
      variables: ['system_prompt', 'memory_context', 'user_prompt'],
      requirements: {
        minContextWindow: 4096,
        supportsSystemPrompt: true,
      },
    });
    
    // Mistral/Mixtral template
    this.templates.set('mistral', {
      id: 'mistral',
      name: 'Mistral Format',
      modelPattern: 'mistral|mixtral',
      template: `<s>[INST] {system_prompt}

{memory_context}

{user_prompt} [/INST]`,
      variables: ['system_prompt', 'memory_context', 'user_prompt'],
      requirements: {
        minContextWindow: 8192,
        supportsSystemPrompt: true,
      },
    });
    
    // Generic template for unknown models
    this.templates.set('generic', {
      id: 'generic',
      name: 'Generic Format',
      modelPattern: '.*',
      template: `{system_prompt}

{memory_context}

User: {user_prompt}Assistant:`,
      variables: ['system_prompt', 'memory_context', 'user_prompt'],
      requirements: {
        minContextWindow: 2048,
        supportsSystemPrompt: true,
      },
    });
  }
  
  generatePrompt(
    character: CharacterProfile,
    context: CharacterContext,
    userPrompt: string,
    modelName: string,
    options: PromptGenerationOptions = {}
  ): string {
    // Find matching template
    const template = this.findTemplateForModel(modelName);
    
    // Generate prompt components
    const systemPrompt = this.generateSystemPrompt(character, options);
    const memoryContext = this.generateMemoryContext(character, context, options);
    
    // Replace variables in template
    let prompt = template.template;
    prompt = prompt.replace('{system_prompt}', systemPrompt);
    prompt = prompt.replace('{memory_context}', memoryContext);
    prompt = prompt.replace('{user_prompt}', userPrompt);
    
    logger.debug({ 
      characterId: character.id, 
      modelName, 
      templateId: template.id 
    }, 'Generated character prompt');
    
    return prompt;
  }
  
  private findTemplateForModel(modelName: string): PromptTemplate {
    const modelNameLower = modelName.toLowerCase();
    
    // Try to find specific template
    for (const template of this.templates.values()) {
      if (template.id !== 'generic') {
        const pattern = new RegExp(template.modelPattern, 'i');
        if (pattern.test(modelNameLower)) {
          return template;
        }
      }
    }
    
    // Fall back to generic template
    return this.templates.get('generic')!;
  }
  
  private generateSystemPrompt(
    character: CharacterProfile,
    options: PromptGenerationOptions
  ): string {
    const style = options.style || 'balanced';
    let prompt = '';
    
    // Character introduction
    prompt += `You are ${character.name}, ${character.description}\n\n`;
    
    // Personality traits
    if (options.includePersonality !== false) {
      prompt += this.generatePersonalityDescription(character.personality, style);
    }
    
    // Background
    if (options.includeBackground !== false && character.background) {
      prompt += this.generateBackgroundDescription(character.background, style);
    }
    
    // Voice and communication style
    prompt += this.generateVoiceDescription(character.voice, style);
    
    // Knowledge domains
    if (character.knowledge.length > 0) {
      prompt += this.generateKnowledgeDescription(character.knowledge);
    }
    
    // Core instructions
    prompt += '\n\nCore instructions:\n';
    prompt += '- Stay in character at all times\n';
    prompt += '- Respond authentically based on your personality and background\n';
    prompt += '- Draw from your experiences and knowledge when relevant\n';
    prompt += '- Maintain consistent voice and mannerisms\n';
    
    return prompt.trim();
  }
  
  private generatePersonalityDescription(
    personality: PersonalityTraits,
    style: 'detailed' | 'concise' | 'balanced'
  ): string {
    let description = '\nPersonality:\n';
    
    if (style === 'detailed') {
      // Big Five traits with detailed descriptions
      description += `- Openness: ${personality.openness}/100 - ${this.describeOpenness(personality.openness)}\n`;
      description += `- Conscientiousness: ${personality.conscientiousness}/100 - ${this.describeConscientiousness(personality.conscientiousness)}\n`;
      description += `- Extraversion: ${personality.extraversion}/100 - ${this.describeExtraversion(personality.extraversion)}\n`;
      description += `- Agreeableness: ${personality.agreeableness}/100 - ${this.describeAgreeableness(personality.agreeableness)}\n`;
      description += `- Emotional Stability: ${100 - personality.neuroticism}/100 - ${this.describeEmotionalStability(100 - personality.neuroticism)}\n`;
      
      // Additional traits
      if (personality.humor > 50) description += `- Sense of humor: ${this.describeHumor(personality.humor)}\n`;
      if (personality.empathy > 50) description += `- Empathy: ${this.describeEmpathy(personality.empathy)}\n`;
    } else if (style === 'concise') {
      // Just key traits
      description += `Key traits: ${personality.traits.join(', ')}\n`;
    } else {
      // Balanced - natural language description
      description += this.generateNaturalPersonalityDescription(personality);
    }
    
    // Always include quirks and values
    if (personality.quirks.length > 0) {
      description += `Quirks: ${personality.quirks.join(', ')}\n`;
    }
    if (personality.values.length > 0) {
      description += `Core values: ${personality.values.join(', ')}\n`;
    }
    
    return description;
  }
  
  private generateBackgroundDescription(
    background: CharacterBackground,
    style: 'detailed' | 'concise' | 'balanced'
  ): string {
    let description = '\nBackground:\n';
    
    if (style === 'detailed') {
      if (background.occupation) description += `- Occupation: ${background.occupation}\n`;
      if (background.education) description += `- Education: ${background.education}\n`;
      if (background.origin) description += `- Origin: ${background.origin}\n`;
      if (background.age) description += `- Age: ${background.age}\n`;
      if (background.culturalBackground) description += `- Cultural background: ${background.culturalBackground}\n`;
      description += `- Interests: ${background.interests.join(', ')}\n`;
      description += `- Areas of expertise: ${background.expertise.join(', ')}\n`;
      if (background.experiences.length > 0) {
        description += `- Key experiences: ${background.experiences.join('; ')}\n`;
      }
    } else {
      // Concise or balanced - narrative form
      const parts = [];
      if (background.occupation) parts.push(`works as ${background.occupation}`);
      if (background.origin) parts.push(`from ${background.origin}`);
      if (background.education) parts.push(`studied ${background.education}`);
      
      if (parts.length > 0) {
        description += `You ${parts.join(', ')}. `;
      }
      
      if (background.interests.length > 0) {
        description += `Your interests include ${background.interests.join(', ')}. `;
      }
      
      if (background.expertise.length > 0) {
        description += `You have expertise in ${background.expertise.join(', ')}.\n`;
      }
    }
    
    return description;
  }
  
  private generateVoiceDescription(
    voice: VoiceStyle,
    style: 'detailed' | 'concise' | 'balanced'
  ): string {
    let description = '\nCommunication style:\n';
    
    // Tone and formality
    description += `- Speak in a ${voice.tone} tone`;
    if (voice.formalityLevel > 70) {
      description += ', maintaining professionalism';
    } else if (voice.formalityLevel < 30) {
      description += ', keeping things casual and relaxed';
    }
    description += '\n';
    
    // Vocabulary and structure
    description += `- Use ${voice.vocabulary} vocabulary with ${voice.sentenceStructure} sentence structures\n`;
    
    // Speech patterns
    if (voice.speechPatterns.length > 0) {
      description += `- Speech patterns: ${voice.speechPatterns.join(', ')}\n`;
    }
    
    // Catchphrases
    if (voice.catchphrases.length > 0 && style !== 'concise') {
      description += `- Occasionally use phrases like: "${voice.catchphrases.join('", "')}"\n`;
    }
    
    // Greetings and farewells
    if (style === 'detailed') {
      if (voice.greetings.length > 0) {
        description += `- Greet with: "${voice.greetings.join('", "')}"\n`;
      }
      if (voice.farewells.length > 0) {
        description += `- Say goodbye with: "${voice.farewells.join('", "')}"\n`;
      }
    }
    
    return description;
  }
  
  private generateKnowledgeDescription(knowledge: CharacterProfile['knowledge']): string {
    let description = '\nKnowledge and expertise:\n';
    
    const expertDomains = knowledge.filter(k => k.expertise === 'expert');
    const advancedDomains = knowledge.filter(k => k.expertise === 'advanced');
    const otherDomains = knowledge.filter(k => k.expertise !== 'expert' && k.expertise !== 'advanced');
    
    if (expertDomains.length > 0) {
      description += `- Expert in: ${expertDomains.map(k => k.domain).join(', ')}\n`;
    }
    
    if (advancedDomains.length > 0) {
      description += `- Advanced knowledge of: ${advancedDomains.map(k => k.domain).join(', ')}\n`;
    }
    
    if (otherDomains.length > 0) {
      description += `- Familiar with: ${otherDomains.map(k => k.domain).join(', ')}\n`;
    }
    
    // Mention limitations
    const limitations = knowledge.flatMap(k => k.limitations);
    if (limitations.length > 0) {
      description += `- Be aware of limitations in: ${limitations.join(', ')}\n`;
    }
    
    return description;
  }
  
  private generateMemoryContext(
    character: CharacterProfile,
    context: CharacterContext,
    options: PromptGenerationOptions
  ): string {
    if (!options.includeMemories || context.recentMemories.length === 0) {
      return '';
    }
    
    let memoryContext = '\nRecent memories and context:\n';
    
    const memoryCount = options.memoryCount || 5;
    const memories = context.recentMemories.slice(0, memoryCount);
    
    for (const memory of memories) {
      const timeAgo = this.formatTimeAgo(memory.timestamp);
      memoryContext += `- ${timeAgo}: ${memory.content}`;
      
      if (memory.emotionalValence !== 0) {
        const emotion = memory.emotionalValence > 0 ? 'positive' : 'negative';
        memoryContext += ` (${emotion} memory)`;
      }
      
      memoryContext += '\n';
    }
    
    // Add current mood if present
    if (context.currentMood) {
      memoryContext += `\nCurrent emotional state: ${context.currentMood.primary} (intensity: ${context.currentMood.intensity}/100)\n`;
    }
    
    // Add active goals
    if (context.activeGoals && context.activeGoals.length > 0) {
      memoryContext += `Current goals: ${context.activeGoals.join(', ')}\n`;
    }
    
    return memoryContext;
  }
  
  // Helper methods for personality descriptions
  
  private describeOpenness(value: number): string {
    if (value > 80) return 'highly creative, imaginative, and open to new experiences';
    if (value > 60) return 'curious and willing to explore new ideas';
    if (value > 40) return 'balanced between tradition and innovation';
    if (value > 20) return 'prefers familiar patterns and proven methods';
    return 'strongly values tradition and routine';
  }
  
  private describeConscientiousness(value: number): string {
    if (value > 80) return 'highly organized, disciplined, and detail-oriented';
    if (value > 60) return 'responsible and goal-oriented';
    if (value > 40) return 'moderately organized with flexible planning';
    if (value > 20) return 'spontaneous and adaptable';
    return 'very flexible and improvisational';
  }
  
  private describeExtraversion(value: number): string {
    if (value > 80) return 'highly outgoing, energetic, and social';
    if (value > 60) return 'sociable and enjoys interactions';
    if (value > 40) return 'balanced between social and solitary activities';
    if (value > 20) return 'prefers smaller groups and quiet settings';
    return 'highly introverted and values solitude';
  }
  
  private describeAgreeableness(value: number): string {
    if (value > 80) return 'extremely compassionate, trusting, and cooperative';
    if (value > 60) return 'friendly and considerate of others';
    if (value > 40) return 'balanced between cooperation and assertiveness';
    if (value > 20) return 'direct and competitive';
    return 'highly independent and skeptical';
  }
  
  private describeEmotionalStability(value: number): string {
    if (value > 80) return 'very calm, stable, and resilient';
    if (value > 60) return 'generally composed and steady';
    if (value > 40) return 'experiences normal emotional variations';
    if (value > 20) return 'somewhat sensitive to stress';
    return 'highly sensitive and emotionally reactive';
  }
  
  private describeHumor(value: number): string {
    if (value > 80) return 'Uses humor frequently, enjoys wordplay and jokes';
    if (value > 60) return 'Appreciates humor and occasionally makes jokes';
    return 'Has a good sense of humor when appropriate';
  }
  
  private describeEmpathy(value: number): string {
    if (value > 80) return 'Deeply empathetic, highly attuned to others\' emotions';
    if (value > 60) return 'Shows genuine concern and understanding for others';
    return 'Demonstrates appropriate empathy in interactions';
  }
  
  private generateNaturalPersonalityDescription(personality: PersonalityTraits): string {
    const traits = [];
    
    // Extraversion
    if (personality.extraversion > 70) {
      traits.push('outgoing and energetic');
    } else if (personality.extraversion < 30) {
      traits.push('thoughtful and introspective');
    }
    
    // Agreeableness
    if (personality.agreeableness > 70) {
      traits.push('warm and cooperative');
    } else if (personality.agreeableness < 30) {
      traits.push('direct and independent');
    }
    
    // Conscientiousness
    if (personality.conscientiousness > 70) {
      traits.push('organized and detail-oriented');
    } else if (personality.conscientiousness < 30) {
      traits.push('flexible and spontaneous');
    }
    
    // Add custom traits
    traits.push(...personality.traits);
    
    return `You are ${traits.join(', ')}. `;
  }
  
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return timestamp.toLocaleDateString();
  }
  
  // Template management methods
  
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
    logger.info({ templateId: template.id }, 'Added prompt template');
  }
  
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }
  
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }
}