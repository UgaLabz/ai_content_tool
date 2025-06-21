const axios = require('axios');

async function testCharacterCreation() {
  try {
    console.log('Testing character creation...');
    
    const characterData = {
      id: 'test-char-' + Date.now(),
      name: 'Test Character',
      description: 'A test character for debugging',
      personality: {
        openness: 75,
        conscientiousness: 80,
        extraversion: 65,
        agreeableness: 85,
        neuroticism: 30,
        humor: 70,
        formality: 50,
        empathy: 80,
        creativity: 75,
        analyticalThinking: 60,
        traits: ['friendly', 'helpful', 'curious'],
        quirks: ['tends to overthink'],
        values: ['honesty', 'kindness']
      },
      background: {
        occupation: 'Test Subject',
        education: 'PhD in Testing',
        origin: 'Test Lab',
        age: '25',
        interests: ['debugging', 'testing'],
        expertise: ['software testing'],
        experiences: ['worked on many test projects'],
        culturalBackground: 'International'
      },
      voice: {
        tone: 'friendly',
        vocabulary: 'moderate',
        sentenceStructure: 'varied',
        pacing: 'moderate',
        speechPatterns: ['I think...', 'Let me see...'],
        catchphrases: ['Testing, testing!'],
        greetings: ['Hello there!'],
        farewells: ['See you later!'],
        formalityLevel: 50,
        useOfSlang: false,
        useOfTechnicalTerms: true,
        preferredPronouns: 'they/them'
      },
      knowledge: [
        {
          domain: 'Software Testing',
          expertise: 'expert',
          confidence: 90,
          limitations: ['hardware testing']
        }
      ],
      relationships: [],
      memories: []
    };

    console.log('Sending request to API...');
    const response = await axios.post('http://localhost:3000/api/characters', characterData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.id) {
      console.log('✅ Character created successfully!');
      console.log('Character ID:', response.data.id);
      console.log('Character Name:', response.data.name);
    } else {
      console.log('❌ Character creation returned empty or invalid data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCharacterCreation();