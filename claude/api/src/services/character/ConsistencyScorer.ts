import { 
  CharacterProfile, 
  CharacterResponse,
  ConsistencyScore,
  PersonalityTraits,
  VoiceStyle,
  CharacterMemory
} from '../../models/character';
import { logger } from '../../utils/logger';

export interface ConsistencyMetrics {
  personalityConsistency: number;
  voiceConsistency: number;
  knowledgeConsistency: number;
  emotionalConsistency: number;
  memoryConsistency: number;
  overallConsistency: number;
  violations: string[];
  suggestions: string[];
}

export class ConsistencyScorer {
  /**
   * Score the consistency of a response against a character profile
   */
  scoreResponse(
    response: string,
    character: CharacterProfile,
    context?: {
      recentResponses?: string[];
      currentMood?: string;
      recentMemories?: CharacterMemory[];
    }
  ): ConsistencyScore {
    const metrics = this.calculateMetrics(response, character, context);
    
    return {
      overall: metrics.overallConsistency,
      personality: metrics.personalityConsistency,
      voice: metrics.voiceConsistency,
      knowledge: metrics.knowledgeConsistency,
      emotional: metrics.emotionalConsistency,
      details: [
        ...metrics.violations,
        ...metrics.suggestions.map(s => `Suggestion: ${s}`)
      ]
    };
  }
  
  private calculateMetrics(
    response: string,
    character: CharacterProfile,
    context?: any
  ): ConsistencyMetrics {
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    // Calculate individual consistency scores
    const personalityScore = this.scorePersonalityConsistency(
      response, 
      character.personality, 
      violations
    );
    
    const voiceScore = this.scoreVoiceConsistency(
      response, 
      character.voice, 
      violations
    );
    
    const knowledgeScore = this.scoreKnowledgeConsistency(
      response, 
      character, 
      violations
    );
    
    const emotionalScore = this.scoreEmotionalConsistency(
      response, 
      character, 
      context?.currentMood,
      violations
    );
    
    const memoryScore = this.scoreMemoryConsistency(
      response,
      context?.recentMemories || [],
      violations
    );
    
    // Calculate overall score (weighted average)
    const overallScore = (
      personalityScore * 0.3 +
      voiceScore * 0.3 +
      knowledgeScore * 0.2 +
      emotionalScore * 0.1 +
      memoryScore * 0.1
    );
    
    // Generate suggestions based on scores
    if (personalityScore < 70) {
      suggestions.push('Response could better reflect character personality traits');
    }
    if (voiceScore < 70) {
      suggestions.push('Adjust tone and vocabulary to match character voice');
    }
    if (knowledgeScore < 70) {
      suggestions.push('Ensure response aligns with character knowledge domains');
    }
    
    logger.debug({
      characterId: character.id,
      scores: {
        personality: personalityScore,
        voice: voiceScore,
        knowledge: knowledgeScore,
        emotional: emotionalScore,
        memory: memoryScore,
        overall: overallScore
      }
    }, 'Consistency scores calculated');
    
    return {
      personalityConsistency: personalityScore,
      voiceConsistency: voiceScore,
      knowledgeConsistency: knowledgeScore,
      emotionalConsistency: emotionalScore,
      memoryConsistency: memoryScore,
      overallConsistency: overallScore,
      violations,
      suggestions
    };
  }
  
  private scorePersonalityConsistency(
    response: string,
    personality: PersonalityTraits,
    violations: string[]
  ): number {
    let score = 100;
    const responseLower = response.toLowerCase();
    
    // Check extraversion consistency
    const excitedWords = ['excited', 'thrilled', 'amazing', 'awesome', 'fantastic'];
    const quietWords = ['perhaps', 'maybe', 'somewhat', 'rather', 'quite'];
    
    const hasExcited = excitedWords.some(w => responseLower.includes(w));
    const hasQuiet = quietWords.some(w => responseLower.includes(w));
    
    if (personality.extraversion > 70 && hasQuiet && !hasExcited) {
      score -= 15;
      violations.push('Response seems too reserved for extraverted personality');
    } else if (personality.extraversion < 30 && hasExcited && !hasQuiet) {
      score -= 15;
      violations.push('Response seems too energetic for introverted personality');
    }
    
    // Check formality consistency
    const formalIndicators = ['therefore', 'furthermore', 'nevertheless', 'indeed'];
    const casualIndicators = ['yeah', 'gonna', 'wanna', 'hey', 'cool'];
    
    const hasFormal = formalIndicators.some(w => responseLower.includes(w));
    const hasCasual = casualIndicators.some(w => responseLower.includes(w));
    
    if (personality.formality > 70 && hasCasual) {
      score -= 20;
      violations.push('Casual language inconsistent with formal personality');
    } else if (personality.formality < 30 && hasFormal) {
      score -= 20;
      violations.push('Formal language inconsistent with casual personality');
    }
    
    // Check trait consistency
    if (personality.traits.includes('optimistic')) {
      const negativeWords = ['unfortunately', 'sadly', 'terrible', 'awful', 'bad'];
      if (negativeWords.some(w => responseLower.includes(w))) {
        score -= 10;
        violations.push('Negative tone conflicts with optimistic trait');
      }
    }
    
    if (personality.traits.includes('analytical')) {
      const analyticalWords = ['analyze', 'consider', 'examine', 'evaluate', 'assess'];
      if (!analyticalWords.some(w => responseLower.includes(w)) && response.length > 100) {
        score -= 5;
      }
    }
    
    // Check humor consistency
    const humorIndicators = ['haha', 'joke', 'funny', 'laugh', '😄', '😊', '!'];
    const hasHumor = humorIndicators.some(w => response.includes(w));
    
    if (personality.humor > 70 && !hasHumor && response.length > 50) {
      score -= 5;
    } else if (personality.humor < 30 && hasHumor) {
      score -= 10;
      violations.push('Humor inconsistent with serious personality');
    }
    
    return Math.max(0, score);
  }
  
  private scoreVoiceConsistency(
    response: string,
    voice: VoiceStyle,
    violations: string[]
  ): number {
    let score = 100;
    
    // Check vocabulary complexity
    const words = response.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    
    if (voice.vocabulary === 'simple' && avgWordLength > 6) {
      score -= 15;
      violations.push('Vocabulary too complex for simple voice style');
    } else if (voice.vocabulary === 'advanced' && avgWordLength < 4) {
      score -= 15;
      violations.push('Vocabulary too simple for advanced voice style');
    }
    
    // Check sentence structure
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;
    
    if (voice.sentenceStructure === 'simple' && avgSentenceLength > 15) {
      score -= 10;
      violations.push('Sentences too complex for simple structure preference');
    } else if (voice.sentenceStructure === 'complex' && avgSentenceLength < 8) {
      score -= 10;
      violations.push('Sentences too simple for complex structure preference');
    }
    
    // Check tone consistency
    const toneViolations = this.checkToneConsistency(response, voice.tone);
    score -= toneViolations * 10;
    
    // Check for catchphrases (bonus if used appropriately)
    if (voice.catchphrases.length > 0) {
      const usedCatchphrase = voice.catchphrases.some(phrase => 
        response.toLowerCase().includes(phrase.toLowerCase())
      );
      if (usedCatchphrase) {
        score = Math.min(100, score + 5); // Small bonus
      }
    }
    
    // Check speech patterns
    if (voice.speechPatterns.includes('asks rhetorical questions')) {
      const hasQuestion = response.includes('?');
      if (!hasQuestion && response.length > 100) {
        score -= 5;
      }
    }
    
    return Math.max(0, score);
  }
  
  private scoreKnowledgeConsistency(
    response: string,
    character: CharacterProfile,
    violations: string[]
  ): number {
    let score = 100;
    const responseLower = response.toLowerCase();
    
    // Check if response claims knowledge outside expertise
    const expertDomains = character.knowledge
      .filter(k => k.expertise === 'expert')
      .map(k => k.domain.toLowerCase());
    
    // Look for confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly'];
    const hasHighConfidence = confidenceWords.some(w => responseLower.includes(w));
    
    // Check for technical terms usage
    const technicalTerms = this.extractTechnicalTerms(response);
    
    if (technicalTerms.length > 0 && hasHighConfidence) {
      // Check if using technical terms outside expertise
      const hasRelevantExpertise = expertDomains.some(domain => 
        technicalTerms.some(term => this.isTermRelatedToDomain(term, domain))
      );
      
      if (!hasRelevantExpertise) {
        score -= 20;
        violations.push('Showing high confidence in areas outside expertise');
      }
    }
    
    // Check for acknowledgment of limitations
    const limitationPhrases = ['not sure', 'might be', 'could be', 'perhaps'];
    const acknowledgesLimits = limitationPhrases.some(p => responseLower.includes(p));
    
    // If discussing topics outside expertise without acknowledging limits
    if (!acknowledgesLimits && technicalTerms.length > 3) {
      const inExpertise = this.isResponseInExpertise(response, character.knowledge);
      if (!inExpertise) {
        score -= 15;
        violations.push('Should acknowledge limitations when discussing unfamiliar topics');
      }
    }
    
    return Math.max(0, score);
  }
  
  private scoreEmotionalConsistency(
    response: string,
    character: CharacterProfile,
    currentMood: string | undefined,
    violations: string[]
  ): number {
    let score = 100;
    
    // If character has low emotional stability, expect more variation
    if (character.personality.neuroticism > 70) {
      // High neuroticism - emotions should be more apparent
      const emotionWords = this.detectEmotionWords(response);
      if (emotionWords.length === 0 && response.length > 50) {
        score -= 10;
        violations.push('Response lacks emotional expression for emotionally reactive character');
      }
    } else if (character.personality.neuroticism < 30) {
      // Low neuroticism - should be more stable
      const strongEmotions = ['angry', 'furious', 'devastated', 'ecstatic', 'terrified'];
      if (strongEmotions.some(e => response.toLowerCase().includes(e))) {
        score -= 15;
        violations.push('Strong emotions inconsistent with stable personality');
      }
    }
    
    // Check mood consistency if provided
    if (currentMood) {
      const moodConsistent = this.isMoodConsistent(response, currentMood);
      if (!moodConsistent) {
        score -= 20;
        violations.push(`Response tone doesn't match current ${currentMood} mood`);
      }
    }
    
    return Math.max(0, score);
  }
  
  private scoreMemoryConsistency(
    response: string,
    recentMemories: CharacterMemory[],
    violations: string[]
  ): number {
    let score = 100;
    
    // Check for contradictions with recent memories
    for (const memory of recentMemories) {
      if (this.contradictsMemory(response, memory)) {
        score -= 25;
        violations.push(`Response contradicts recent memory: "${memory.content}"`);
      }
    }
    
    // Check if important memories are acknowledged when relevant
    const importantMemories = recentMemories.filter(m => m.importance > 70);
    for (const memory of importantMemories) {
      if (this.shouldAcknowledgeMemory(response, memory) && 
          !this.acknowledgesMemory(response, memory)) {
        score -= 10;
      }
    }
    
    return Math.max(0, score);
  }
  
  // Helper methods
  
  private checkToneConsistency(response: string, expectedTone: VoiceStyle['tone']): number {
    const responseLower = response.toLowerCase();
    let violations = 0;
    
    switch (expectedTone) {
      case 'professional':
        if (responseLower.includes('lol') || responseLower.includes('omg')) violations++;
        break;
      case 'casual':
        if (responseLower.includes('furthermore') || responseLower.includes('nevertheless')) violations++;
        break;
      case 'friendly':
        if (!response.includes('!') && !response.includes('😊') && response.length > 50) violations += 0.5;
        break;
      case 'authoritative':
        if (responseLower.includes('maybe') || responseLower.includes('i think')) violations++;
        break;
    }
    
    return violations;
  }
  
  private extractTechnicalTerms(text: string): string[] {
    // Simple heuristic: words that are likely technical
    const words = text.split(/\s+/);
    return words.filter(word => 
      word.length > 8 && 
      /[A-Z]/.test(word) || 
      word.includes('-') ||
      word.endsWith('tion') ||
      word.endsWith('ment') ||
      word.endsWith('ology')
    );
  }
  
  private isTermRelatedToDomain(term: string, domain: string): boolean {
    // Simplified domain matching
    const termLower = term.toLowerCase();
    const domainLower = domain.toLowerCase();
    
    return termLower.includes(domainLower) || domainLower.includes(termLower);
  }
  
  private isResponseInExpertise(response: string, knowledge: CharacterProfile['knowledge']): boolean {
    const expertDomains = knowledge
      .filter(k => k.expertise === 'expert' || k.expertise === 'advanced')
      .map(k => k.domain.toLowerCase());
    
    return expertDomains.some(domain => response.toLowerCase().includes(domain));
  }
  
  private detectEmotionWords(text: string): string[] {
    const emotionWords = [
      'happy', 'sad', 'angry', 'excited', 'worried', 'anxious',
      'delighted', 'frustrated', 'confused', 'surprised', 'disappointed'
    ];
    
    return emotionWords.filter(word => text.toLowerCase().includes(word));
  }
  
  private isMoodConsistent(response: string, mood: string): boolean {
    const responseLower = response.toLowerCase();
    
    switch (mood.toLowerCase()) {
      case 'happy':
        return !responseLower.includes('sad') && !responseLower.includes('upset');
      case 'curious':
        return response.includes('?') || responseLower.includes('wonder');
      case 'concerned':
        return responseLower.includes('worry') || responseLower.includes('concern');
      default:
        return true;
    }
  }
  
  private contradictsMemory(response: string, memory: CharacterMemory): boolean {
    // Simple contradiction detection
    // In production, you'd use more sophisticated NLP
    const responseLower = response.toLowerCase();
    const memoryLower = memory.content.toLowerCase();
    
    // Check for explicit contradictions
    if (memoryLower.includes('never') && responseLower.includes('always')) return true;
    if (memoryLower.includes('always') && responseLower.includes('never')) return true;
    
    return false;
  }
  
  private shouldAcknowledgeMemory(response: string, memory: CharacterMemory): boolean {
    // Check if the response topic relates to the memory
    const keywords = memory.associatedEntities;
    return keywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  private acknowledgesMemory(response: string, memory: CharacterMemory): boolean {
    // Check if response references the memory
    const keywords = memory.content.split(' ').filter(w => w.length > 4);
    return keywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}