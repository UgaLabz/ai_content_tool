export function serializeCharacterProfile(profile: any): any {
  if (!profile) {
    console.log('Profile is null or undefined');
    return null;
  }
  
  try {
    console.log('Serializing profile:', { 
      id: profile.id, 
      name: profile.name,
      hasPersonality: !!profile.personality,
      hasBackground: !!profile.background,
      hasVoice: !!profile.voice,
      hasKnowledge: !!profile.knowledge,
      hasMetadata: !!profile.metadata,
      profileType: typeof profile,
      profileKeys: Object.keys(profile)
    });
    
    // Simple direct mapping without JSON.parse/stringify
    const serialized = {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      personality: profile.personality ? {
        openness: profile.personality.openness,
        conscientiousness: profile.personality.conscientiousness,
        extraversion: profile.personality.extraversion,
        agreeableness: profile.personality.agreeableness,
        neuroticism: profile.personality.neuroticism,
        humor: profile.personality.humor,
        formality: profile.personality.formality,
        empathy: profile.personality.empathy,
        creativity: profile.personality.creativity,
        analyticalThinking: profile.personality.analyticalThinking,
        traits: [...(profile.personality.traits || [])],
        quirks: [...(profile.personality.quirks || [])],
        values: [...(profile.personality.values || [])]
      } : undefined,
      background: profile.background ? {
        occupation: profile.background.occupation,
        education: profile.background.education,
        origin: profile.background.origin,
        age: profile.background.age,
        interests: [...(profile.background.interests || [])],
        expertise: [...(profile.background.expertise || [])],
        experiences: [...(profile.background.experiences || [])],
        culturalBackground: profile.background.culturalBackground
      } : undefined,
      voice: profile.voice ? {
        tone: profile.voice.tone,
        vocabulary: profile.voice.vocabulary,
        sentenceStructure: profile.voice.sentenceStructure,
        pacing: profile.voice.pacing,
        speechPatterns: [...(profile.voice.speechPatterns || [])],
        catchphrases: [...(profile.voice.catchphrases || [])],
        greetings: [...(profile.voice.greetings || [])],
        farewells: [...(profile.voice.farewells || [])],
        formalityLevel: profile.voice.formalityLevel,
        useOfSlang: profile.voice.useOfSlang,
        useOfTechnicalTerms: profile.voice.useOfTechnicalTerms,
        preferredPronouns: profile.voice.preferredPronouns
      } : undefined,
      knowledge: profile.knowledge ? profile.knowledge.map((k: any) => ({
        domain: k.domain,
        expertise: k.expertise,
        confidence: k.confidence,
        limitations: [...(k.limitations || [])]
      })) : [],
      relationships: [...(profile.relationships || [])],
      memories: profile.memories ? profile.memories.map((m: any) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
      })) : [],
      metadata: profile.metadata ? {
        createdAt: profile.metadata.createdAt instanceof Date ? profile.metadata.createdAt.toISOString() : profile.metadata.createdAt,
        updatedAt: profile.metadata.updatedAt instanceof Date ? profile.metadata.updatedAt.toISOString() : profile.metadata.updatedAt,
        version: profile.metadata.version,
        tags: [...(profile.metadata.tags || [])]
      } : undefined
    };
    
    console.log('Serialized profile:', JSON.stringify(serialized, null, 2));
    return serialized;
  } catch (error) {
    console.error('Error serializing character profile:', error);
    console.error('Profile that caused error:', profile);
    return null;
  }
}

export function serializeCharacterProfiles(profiles: any[]): any[] {
  console.log('Serializing profiles:', profiles.length);
  const result = profiles.map(serializeCharacterProfile).filter(p => p !== null);
  console.log('Serialized result:', result);
  return result;
}