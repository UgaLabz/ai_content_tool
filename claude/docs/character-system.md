# Character System Documentation

## Overview

The Character System enables AI models to maintain consistent personalities, memories, and behavioral patterns across conversations. It's designed to work seamlessly with both local LLMs (Ollama, LM Studio, LocalAI) and cloud providers.

## Architecture

### Core Components

1. **Character Profile Manager** - Manages character definitions and persistence
2. **Prompt Template Engine** - Generates model-specific prompts with character context
3. **Consistency Scorer** - Evaluates response consistency against character profiles
4. **Character Service** - Orchestrates character-aware generation
5. **Character-Aware Orchestrator** - Extends hybrid orchestrator with character support

## Character Profile Structure

### Personality Model (Big Five + Extensions)

```typescript
interface PersonalityTraits {
  // Big Five Personality Traits (0-100)
  openness: number;           // Creativity, curiosity, openness to new experiences
  conscientiousness: number;  // Organization, discipline, reliability
  extraversion: number;       // Sociability, energy, assertiveness
  agreeableness: number;      // Cooperation, trust, empathy
  neuroticism: number;        // Emotional stability (inverse)
  
  // Additional Traits
  humor: number;              // Sense of humor, playfulness
  formality: number;          // Language formality level
  empathy: number;            // Emotional understanding
  creativity: number;         // Creative thinking ability
  analyticalThinking: number; // Logical reasoning ability
  
  // Descriptive Arrays
  traits: string[];           // Key personality descriptors
  quirks: string[];           // Unique behavioral patterns
  values: string[];           // Core beliefs and principles
}
```

### Voice and Communication Style

```typescript
interface VoiceStyle {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'empathetic';
  vocabulary: 'simple' | 'moderate' | 'advanced' | 'technical' | 'mixed';
  sentenceStructure: 'simple' | 'complex' | 'varied';
  pacing: 'slow' | 'moderate' | 'fast' | 'dynamic';
  
  speechPatterns: string[];    // Unique speech patterns
  catchphrases: string[];      // Signature phrases
  greetings: string[];         // Typical greetings
  farewells: string[];         // Typical farewells
  
  formalityLevel: number;      // 0-100 scale
  useOfSlang: boolean;
  useOfTechnicalTerms: boolean;
  preferredPronouns?: string;
}
```

### Knowledge and Expertise

```typescript
interface KnowledgeDomain {
  domain: string;
  expertise: 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;  // 0-100
  limitations: string[];
}
```

### Memory System

```typescript
interface CharacterMemory {
  id: string;
  type: 'interaction' | 'fact' | 'event' | 'emotion' | 'observation';
  content: string;
  timestamp: Date;
  associatedEntities: string[];
  emotionalValence: number;  // -100 to 100
  importance: number;        // 0-100
  retentionPriority: 'low' | 'medium' | 'high';
}
```

## API Endpoints

### Character Management

#### Create Character
```http
POST /api/characters
Content-Type: application/json

{
  "id": "sherlock-holmes",
  "name": "Sherlock Holmes",
  "description": "The world's greatest detective",
  "personality": {
    "openness": 95,
    "conscientiousness": 60,
    "extraversion": 30,
    "agreeableness": 20,
    "neuroticism": 40,
    "humor": 30,
    "formality": 50,
    "empathy": 15,
    "creativity": 90,
    "analyticalThinking": 100,
    "traits": ["brilliant", "observant", "eccentric"],
    "quirks": ["plays violin when thinking"],
    "values": ["logic", "truth"]
  },
  "background": {
    "occupation": "Consulting Detective",
    "education": "Self-taught",
    "origin": "London",
    "interests": ["chemistry", "violin", "puzzles"],
    "expertise": ["deduction", "forensics"],
    "experiences": ["Solved hundreds of cases"]
  },
  "voice": {
    "tone": "authoritative",
    "vocabulary": "advanced",
    "sentenceStructure": "complex",
    "pacing": "fast",
    "speechPatterns": ["deductive reasoning chains"],
    "catchphrases": ["Elementary!", "The game is afoot!"],
    "greetings": ["What brings you to Baker Street?"],
    "farewells": ["The case awaits"],
    "formalityLevel": 50,
    "useOfSlang": false,
    "useOfTechnicalTerms": true
  },
  "knowledge": [
    {
      "domain": "Criminal Investigation",
      "expertise": "expert",
      "confidence": 100,
      "limitations": []
    }
  ]
}
```

#### Get All Characters
```http
GET /api/characters
```

#### Get Character by ID
```http
GET /api/characters/{characterId}
```

#### Update Character
```http
PATCH /api/characters/{characterId}
Content-Type: application/json

{
  "personality": {
    "humor": 40
  }
}
```

#### Delete Character
```http
DELETE /api/characters/{characterId}
```

### Memory Management

#### Add Memory
```http
POST /api/characters/{characterId}/memories
Content-Type: application/json

{
  "type": "interaction",
  "content": "User mentioned they enjoy Victorian literature",
  "associatedEntities": ["user", "literature", "Victorian era"],
  "emotionalValence": 10,
  "importance": 60,
  "retentionPriority": "medium"
}
```

#### Get Recent Memories
```http
GET /api/characters/{characterId}/memories?count=10&types=interaction,fact
```

#### Search Memories
```http
GET /api/characters/{characterId}/memories/search?q=literature&minImportance=50
```

### Character-Based Generation

#### Generate with Character
```http
POST /api/generate/character
Content-Type: application/json

{
  "prompt": "What's your analysis of the crime scene?",
  "characterId": "sherlock-holmes",
  "options": {
    "temperature": 0.7,
    "maxTokens": 500,
    "enforceConsistency": true,
    "includeMemories": true,
    "memoryCount": 5
  },
  "context": {
    "currentMood": {
      "primary": "focused",
      "intensity": 80
    },
    "activeGoals": ["Solve the case"],
    "environment": {
      "location": "Crime scene",
      "timeOfDay": "evening"
    }
  }
}
```

Response includes consistency scoring:
```json
{
  "content": "Fascinating! The pattern of blood spatter...",
  "characterId": "sherlock-holmes",
  "consistency": {
    "overall": 92,
    "personality": 95,
    "voice": 90,
    "knowledge": 93,
    "emotional": 88,
    "details": []
  },
  "metadata": {
    "generationTime": 1234,
    "modelUsed": "llama3.1:70b",
    "retriedForConsistency": false
  }
}
```

## Model-Specific Prompt Templates

The system includes optimized templates for different model architectures:

### Llama Models
```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{character_description}
{personality_traits}
{voice_guidelines}
<|eot_id|>
{memory_context}
<|start_header_id|>user<|end_header_id|>
{user_prompt}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
```

### ChatML Format (GPT, Mixtral)
```
<|im_start|>system
{character_description}
{personality_traits}
{voice_guidelines}
<|im_end|>
{memory_context}
<|im_start|>user
{user_prompt}<|im_end|>
<|im_start|>assistant
```

### Mistral Format
```
<s>[INST] {system_prompt}

{memory_context}

{user_prompt} [/INST]
```

## Consistency Scoring

The consistency scorer evaluates responses across multiple dimensions:

1. **Personality Consistency (30%)** - Matches Big Five traits
2. **Voice Consistency (30%)** - Tone, vocabulary, speech patterns
3. **Knowledge Consistency (20%)** - Stays within expertise
4. **Emotional Consistency (10%)** - Mood stability
5. **Memory Consistency (10%)** - Doesn't contradict memories

### Scoring Algorithm

```typescript
// Example scoring for personality
if (character.extraversion > 70 && responseSeemsTooQuiet) {
  score -= 15;
  violations.push('Response too reserved for extraverted personality');
}

// Catchphrase bonus
if (response.includes(character.catchphrases)) {
  score += 5; // Small bonus for authentic touches
}

// Knowledge boundaries
if (showingHighConfidenceOutsideExpertise) {
  score -= 20;
  violations.push('Overconfident in unfamiliar domain');
}
```

## Best Practices

### Character Design

1. **Balanced Traits** - Avoid extremes in all personality dimensions
2. **Clear Voice** - Define 3-5 distinct speech patterns
3. **Bounded Knowledge** - Specify both expertise and limitations
4. **Rich Background** - Provide context for personality development

### Memory Management

1. **Retention Priorities**:
   - High: Critical facts, emotional moments, user preferences
   - Medium: Regular interactions, observations
   - Low: Routine exchanges, temporary context

2. **Memory Pruning**:
   - Keep all high-priority memories
   - Keep recent 300 medium-priority memories
   - Keep recent 100 low-priority memories

### Consistency Enforcement

1. **Soft Enforcement** (default):
   - Generate response
   - Score consistency
   - Log warnings if below threshold

2. **Hard Enforcement** (`enforceConsistency: true`):
   - Generate response
   - If score < 70%, regenerate with feedback
   - Return best scoring response

## Performance Considerations

### Model Selection
The character system automatically adjusts model requirements:
- Simple characters (< 5 traits): 3B+ models
- Complex characters (> 10 traits): 7B+ models
- Rich backgrounds + memories: 13B+ models

### Context Window Management
- Basic interaction: 2-4K tokens
- With memories: 4-8K tokens
- Complex scenarios: 8-16K tokens

### Optimization Tips

1. **Limit Active Memories** - Use 5-10 most relevant
2. **Cache Prompt Templates** - Reuse formatted prompts
3. **Batch Character Operations** - Load multiple profiles together
4. **Use Appropriate Models** - Match complexity to model size

## Examples

### Creating a Teacher Character

```javascript
const teacher = {
  id: "ms-johnson",
  name: "Ms. Johnson",
  description: "Enthusiastic high school science teacher",
  personality: {
    openness: 85,
    conscientiousness: 90,
    extraversion: 70,
    agreeableness: 80,
    neuroticism: 25,
    humor: 65,
    formality: 60,
    empathy: 85,
    creativity: 75,
    analyticalThinking: 70,
    traits: ["encouraging", "patient", "knowledgeable"],
    quirks: ["uses lots of real-world examples"],
    values: ["education", "curiosity", "student success"]
  },
  voice: {
    tone: "friendly",
    vocabulary: "moderate",
    sentenceStructure: "simple",
    pacing: "moderate",
    speechPatterns: ["asks thought-provoking questions"],
    catchphrases: ["Great question!", "Let's think about this"],
    greetings: ["Good morning, class!"],
    farewells: ["Keep being curious!"],
    formalityLevel: 60,
    useOfSlang: false,
    useOfTechnicalTerms: true
  }
};
```

### Generating Consistent Responses

```javascript
// First interaction
const response1 = await generateWithCharacter({
  prompt: "Can you explain photosynthesis?",
  characterId: "ms-johnson",
  options: {
    enforceConsistency: true,
    includeMemories: true
  }
});

// Follow-up with memory
const response2 = await generateWithCharacter({
  prompt: "How does that relate to what we discussed?",
  characterId: "ms-johnson",
  options: {
    enforceConsistency: true,
    includeMemories: true,
    memoryCount: 3
  }
});
```

## Troubleshooting

### Low Consistency Scores
- Review personality trait balance
- Check for conflicting traits
- Ensure voice style matches personality
- Verify model has sufficient context

### Memory Issues
- Check memory retention limits
- Verify memory search queries
- Monitor memory storage size
- Review pruning strategy

### Performance Problems
- Reduce memory count in prompts
- Use smaller models for simple characters
- Enable prompt caching
- Batch character operations