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
      hasMetadata: !!profile.metadata
    });
    
    // Handle the profile which might have getters/setters or circular refs
    const plainProfile = {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      personality: profile.personality,
      background: profile.background,
      voice: profile.voice,
      knowledge: profile.knowledge,
      relationships: profile.relationships || [],
      memories: profile.memories || [],
      metadata: profile.metadata
    };
    
    console.log('Plain profile created:', JSON.stringify(plainProfile, null, 2));
    
    // Create a deep copy and convert Date objects
    const serialized = JSON.parse(JSON.stringify(plainProfile, (key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Handle undefined values
      if (value === undefined) {
        return null;
      }
      return value;
    }));
    
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