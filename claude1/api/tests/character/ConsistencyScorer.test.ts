import { ConsistencyScorer } from '../../src/services/character/ConsistencyScorer';
import { CharacterProfile } from '../../src/models/character';

describe('ConsistencyScorer', () => {
  let scorer: ConsistencyScorer;
  let testCharacter: CharacterProfile;
  
  beforeEach(() => {
    scorer = new ConsistencyScorer();
    
    testCharacter = {
      id: 'test-character',
      name: 'Dr. Emily Watson',
      description: 'A friendly and knowledgeable scientist',
      personality: {
        openness: 80,
        conscientiousness: 75,
        extraversion: 60,
        agreeableness: 85,
        neuroticism: 20,
        humor: 40,
        formality: 70,
        empathy: 90,
        creativity: 75,
        analyticalThinking: 85,
        traits: ['analytical', 'compassionate', 'curious'],
        quirks: ['tends to use scientific metaphors'],
        values: ['knowledge', 'helping others'],
      },
      background: {
        occupation: 'Research Scientist',
        education: 'PhD in Biology',
        origin: 'Boston, MA',
        age: 35,
        interests: ['genetics', 'science communication', 'hiking'],
        expertise: ['molecular biology', 'genetics', 'research methodology'],
        experiences: ['Led groundbreaking research on gene therapy'],
        culturalBackground: 'American',
      },
      voice: {
        tone: 'friendly',
        vocabulary: 'advanced',
        sentenceStructure: 'varied',
        pacing: 'moderate',
        speechPatterns: ['uses scientific terminology appropriately'],
        catchphrases: ['Fascinating!', "Let's examine the data"],
        greetings: ['Hello there!', 'Good to see you'],
        farewells: ['Take care', 'Until next time'],
        formalityLevel: 70,
        useOfSlang: false,
        useOfTechnicalTerms: true,
      },
      knowledge: [
        {
          domain: 'Biology',
          expertise: 'expert',
          confidence: 95,
          limitations: [],
        },
        {
          domain: 'Chemistry',
          expertise: 'advanced',
          confidence: 75,
          limitations: ['organic chemistry'],
        },
      ],
      relationships: [],
      memories: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: ['scientist', 'educator'],
      },
    };
  });
  
  describe('scoreResponse', () => {
    it('should score high for consistent responses', () => {
      const response = "Fascinating! Based on the data you've provided, I can see a clear pattern emerging. Let me explain this in scientific terms...";
      
      const score = scorer.scoreResponse(response, testCharacter);
      
      expect(score.overall).toBeGreaterThan(80);
      expect(score.personality).toBeGreaterThan(80);
      expect(score.voice).toBeGreaterThan(80);
    });
    
    it('should score low for inconsistent personality', () => {
      const response = "yeah whatever lol, science is boring anyway";
      
      const score = scorer.scoreResponse(response, testCharacter);
      
      expect(score.overall).toBeLessThan(60);
      expect(score.personality).toBeLessThan(50);
      expect(score.voice).toBeLessThan(50);
    });
    
    it('should detect formality violations', () => {
      const casualResponse = "gonna check out that cool stuff, wanna join?";
      
      const score = scorer.scoreResponse(casualResponse, testCharacter);
      
      expect(score.personality).toBeLessThan(80);
      expect(score.details).toContain('Casual language inconsistent with formal personality');
    });
    
    it('should reward catchphrase usage', () => {
      const responseWithCatchphrase = "Fascinating! This discovery could revolutionize our understanding.";
      const responseWithoutCatchphrase = "This discovery could revolutionize our understanding.";
      
      const scoreWith = scorer.scoreResponse(responseWithCatchphrase, testCharacter);
      const scoreWithout = scorer.scoreResponse(responseWithoutCatchphrase, testCharacter);
      
      expect(scoreWith.voice).toBeGreaterThan(scoreWithout.voice);
    });
    
    it('should check knowledge consistency', () => {
      const overconfidentResponse = "I can definitely explain quantum mechanics in detail - it's simple!";
      
      const score = scorer.scoreResponse(overconfidentResponse, testCharacter);
      
      expect(score.knowledge).toBeLessThan(100);
      expect(score.details.some(d => d.includes('outside expertise'))).toBe(true);
    });
    
    it('should evaluate emotional consistency', () => {
      const emotionallyInconsistent = "I'm absolutely furious about this minor inconvenience!";
      
      const score = scorer.scoreResponse(emotionallyInconsistent, testCharacter);
      
      expect(score.emotional).toBeLessThan(100);
      expect(score.details.some(d => d.includes('Strong emotions inconsistent'))).toBe(true);
    });
    
    it('should check memory consistency', () => {
      const recentMemories = [{
        id: 'mem1',
        type: 'fact',
        content: 'User mentioned they are allergic to peanuts',
        timestamp: new Date(),
        associatedEntities: ['user', 'peanuts', 'allergy'],
        emotionalValence: 0,
        importance: 90,
        retentionPriority: 'high' as const,
      }];
      
      const contradictingResponse = "I always recommend peanut butter for a quick protein boost!";
      
      const score = scorer.scoreResponse(
        contradictingResponse, 
        testCharacter,
        { recentMemories }
      );
      
      expect(score.overall).toBeLessThan(80);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty responses', () => {
      const score = scorer.scoreResponse('', testCharacter);
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
    
    it('should handle very long responses', () => {
      const longResponse = 'This is a test. '.repeat(1000);
      
      const score = scorer.scoreResponse(longResponse, testCharacter);
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
    
    it('should handle responses with special characters', () => {
      const specialResponse = "Let's examine the data! 🧬 The results show a 95% correlation.";
      
      const score = scorer.scoreResponse(specialResponse, testCharacter);
      
      expect(score.overall).toBeGreaterThan(70);
    });
  });
});