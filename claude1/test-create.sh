#!/bin/bash

echo "Creating a new character..."

curl -X POST http://localhost:3000/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-new-'$(date +%s)'",
    "name": "New Test Character",
    "description": "A new test character",
    "personality": {
      "openness": 80,
      "conscientiousness": 70,
      "extraversion": 60,
      "agreeableness": 90,
      "neuroticism": 20,
      "humor": 80,
      "formality": 40,
      "empathy": 85,
      "creativity": 80,
      "analyticalThinking": 65,
      "traits": ["creative", "empathetic", "humorous"],
      "quirks": ["laughs at own jokes"],
      "values": ["creativity", "compassion"]
    },
    "background": {
      "occupation": "Creative Artist",
      "education": "MFA in Creative Arts",
      "origin": "Art Studio",
      "age": 30,
      "interests": ["art", "music", "comedy"],
      "expertise": ["painting", "sculpture"],
      "experiences": ["exhibited in galleries"],
      "culturalBackground": "Cosmopolitan"
    },
    "voice": {
      "tone": "playful",
      "vocabulary": "advanced",
      "sentenceStructure": "complex",
      "pacing": "dynamic",
      "speechPatterns": ["You know what I mean?", "Picture this..."],
      "catchphrases": ["Art is life!"],
      "greetings": ["Hey there, creative soul!"],
      "farewells": ["Keep creating!"],
      "formalityLevel": 40,
      "useOfSlang": true,
      "useOfTechnicalTerms": false,
      "preferredPronouns": "she/her"
    },
    "knowledge": [
      {
        "domain": "Visual Arts",
        "expertise": "expert",
        "confidence": 95,
        "limitations": ["digital art"]
      },
      {
        "domain": "Art History",
        "expertise": "advanced",
        "confidence": 85,
        "limitations": ["ancient art"]
      }
    ],
    "relationships": [],
    "memories": []
  }' | jq .