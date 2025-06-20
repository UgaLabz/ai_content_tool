import { describe, it, expect } from 'vitest'
import { characterFormSchema } from '../character.types'

describe('characterFormSchema', () => {
  it('validates valid character data', () => {
    const validData = {
      name: 'Test Character',
      personality: {
        traits: ['friendly', 'helpful'],
        humor: 75,
        formality: 25,
        enthusiasm: 80,
        empathy: 90,
        quirks: ['Always says hello'],
      },
      voice: {
        tone: 'casual',
        vocabulary: 'simple',
        sentenceStructure: 'short',
        speechPatterns: ['You know?'],
      },
      catchphrases: ['Let\'s do this!'],
      background: 'A helpful assistant',
    }

    const result = characterFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('requires character name', () => {
    const invalidData = {
      personality: {
        traits: [],
        humor: 50,
        formality: 50,
        enthusiasm: 50,
        empathy: 50,
      },
      voice: {
        tone: 'casual',
        vocabulary: 'simple',
        sentenceStructure: 'short',
      },
    }

    const result = characterFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('validates personality slider bounds', () => {
    const invalidData = {
      name: 'Test',
      personality: {
        traits: [],
        humor: 150, // Invalid: > 100
        formality: -10, // Invalid: < 0
        enthusiasm: 50,
        empathy: 50,
      },
      voice: {
        tone: 'casual',
        vocabulary: 'simple',
        sentenceStructure: 'short',
      },
    }

    const result = characterFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('requires at least one personality trait', () => {
    const invalidData = {
      name: 'Test',
      personality: {
        traits: [], // Empty array
        humor: 50,
        formality: 50,
        enthusiasm: 50,
        empathy: 50,
      },
      voice: {
        tone: 'casual',
        vocabulary: 'simple',
        sentenceStructure: 'short',
      },
    }

    const result = characterFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least one trait')
    }
  })

  it('validates voice configuration', () => {
    const invalidData = {
      name: 'Test',
      personality: {
        traits: ['friendly'],
        humor: 50,
        formality: 50,
        enthusiasm: 50,
        empathy: 50,
      },
      voice: {
        tone: '', // Empty required field
        vocabulary: 'simple',
        sentenceStructure: 'short',
      },
    }

    const result = characterFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('allows optional fields to be undefined', () => {
    const minimalData = {
      name: 'Test',
      personality: {
        traits: ['friendly'],
        humor: 50,
        formality: 50,
        enthusiasm: 50,
        empathy: 50,
        // quirks is optional
      },
      voice: {
        tone: 'casual',
        vocabulary: 'simple',
        sentenceStructure: 'short',
        // speechPatterns is optional
      },
      // catchphrases, background, relationships are optional
    }

    const result = characterFormSchema.safeParse(minimalData)
    expect(result.success).toBe(true)
  })
})