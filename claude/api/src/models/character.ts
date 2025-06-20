export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  personality: PersonalityTraits;
  background: CharacterBackground;
  voice: VoiceStyle;
  knowledge: KnowledgeDomain[];
  relationships: CharacterRelationship[];
  memories: CharacterMemory[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags: string[];
  };
}

export interface PersonalityTraits {
  // Core traits (Big Five)
  openness: number; // 0-100: creativity, curiosity
  conscientiousness: number; // 0-100: organized, dependable
  extraversion: number; // 0-100: outgoing, energetic
  agreeableness: number; // 0-100: friendly, compassionate
  neuroticism: number; // 0-100: emotional stability (inverted)
  
  // Additional traits
  humor: number; // 0-100: sense of humor
  formality: number; // 0-100: formal vs casual
  empathy: number; // 0-100: emotional understanding
  creativity: number; // 0-100: creative thinking
  analyticalThinking: number; // 0-100: logical reasoning
  
  // Behavioral tendencies
  traits: string[]; // e.g., ["optimistic", "cautious", "direct"]
  quirks: string[]; // e.g., ["uses metaphors", "asks questions"]
  values: string[]; // e.g., ["honesty", "loyalty", "growth"]
}

export interface CharacterBackground {
  occupation?: string;
  education?: string;
  origin?: string;
  age?: number | string; // Can be specific or range
  interests: string[];
  expertise: string[];
  experiences: string[];
  culturalBackground?: string;
}

export interface VoiceStyle {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'empathetic';
  vocabulary: 'simple' | 'moderate' | 'advanced' | 'technical' | 'mixed';
  sentenceStructure: 'simple' | 'complex' | 'varied';
  pacing: 'slow' | 'moderate' | 'fast' | 'dynamic';
  
  // Speech patterns
  speechPatterns: string[]; // e.g., ["uses analogies", "asks rhetorical questions"]
  catchphrases: string[]; // Signature phrases
  greetings: string[]; // How they greet
  farewells: string[]; // How they say goodbye
  
  // Language preferences
  formalityLevel: number; // 0-100
  useOfSlang: boolean;
  useOfTechnicalTerms: boolean;
  preferredPronouns?: string;
}

export interface KnowledgeDomain {
  domain: string;
  expertise: 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-100
  limitations: string[];
}

export interface CharacterRelationship {
  characterId: string;
  relationshipType: 'colleague' | 'friend' | 'mentor' | 'student' | 'rival' | 'neutral';
  description: string;
  history: string[];
}

export interface CharacterMemory {
  id: string;
  timestamp: Date;
  type: 'interaction' | 'event' | 'fact' | 'emotion';
  content: string;
  importance: number; // 0-100
  associatedEntities: string[];
  emotionalValence: number; // -100 to 100 (negative to positive)
  retentionPriority: 'low' | 'medium' | 'high';
}

export interface CharacterContext {
  characterId: string;
  sessionId: string;
  recentMemories: CharacterMemory[];
  currentMood?: EmotionalState;
  activeGoals: string[];
  situationalContext?: string;
}

export interface EmotionalState {
  primary: string; // e.g., "happy", "curious", "concerned"
  intensity: number; // 0-100
  triggers: string[];
  duration?: number; // minutes
}

export interface CharacterResponse {
  text: string;
  characterId: string;
  emotionalTone: string;
  consistency: ConsistencyScore;
  memories: CharacterMemory[];
}

export interface ConsistencyScore {
  overall: number; // 0-100
  personality: number; // 0-100
  voice: number; // 0-100
  knowledge: number; // 0-100
  emotional: number; // 0-100
  details: string[];
}