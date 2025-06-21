#!/bin/bash

echo "Testing character creation..."

curl -X POST http://localhost:3000/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-char-'$(date +%s)'",
    "name": "Test Character",
    "description": "A test character for debugging",
    "personality": {
      "openness": 75,
      "conscientiousness": 80,
      "extraversion": 65,
      "agreeableness": 85,
      "neuroticism": 30,
      "humor": 70,
      "formality": 50,
      "empathy": 80,
      "creativity": 75,
      "analyticalThinking": 60,
      "traits": ["friendly", "helpful", "curious"],
      "quirks": ["tends to overthink"],
      "values": ["honesty", "kindness"]
    },
    "background": {
      "occupation": "Test Subject",
      "education": "PhD in Testing",
      "origin": "Test Lab",
      "interests": ["debugging", "testing"],
      "expertise": ["software testing"],
      "experiences": ["worked on many test projects"],
      "culturalBackground": "International"
    },
    "voice": {
      "tone": "friendly",
      "vocabulary": "moderate",
      "sentenceStructure": "varied",
      "pacing": "moderate",
      "speechPatterns": ["I think...", "Let me see..."],
      "catchphrases": ["Testing, testing!"],
      "greetings": ["Hello there!"],
      "farewells": ["See you later!"],
      "formalityLevel": 50,
      "useOfSlang": false,
      "useOfTechnicalTerms": true,
      "preferredPronouns": "they/them"
    },
    "knowledge": [
      {
        "domain": "Software Testing",
        "expertise": "expert",
        "confidence": 90,
        "limitations": ["hardware testing"]
      }
    ],
    "relationships": [],
    "memories": []
  }' | jq .