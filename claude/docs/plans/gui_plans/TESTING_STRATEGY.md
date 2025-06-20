# Testing Strategy - AI Content Studio

## Overview

This document outlines the comprehensive testing approach for the AI Content Studio GUI, covering unit tests, integration tests, E2E tests, performance testing, and accessibility testing.

## Testing Philosophy

1. **Test Pyramid Approach**: Many unit tests, fewer integration tests, minimal E2E tests
2. **Shift Left**: Write tests during development, not after
3. **Test Behavior, Not Implementation**: Focus on user outcomes
4. **Continuous Testing**: Run tests on every commit
5. **Visual Regression**: Catch UI changes automatically

## Technology Stack

### Testing Framework
```json
{
  "unit": "Vitest + React Testing Library",
  "integration": "Vitest + MSW (Mock Service Worker)",
  "e2e": "Playwright",
  "visual": "Percy or Chromatic",
  "performance": "Lighthouse CI + Web Vitals",
  "accessibility": "axe-core + Pa11y"
}
```

## Test Coverage Goals

- **Unit Tests**: 85% coverage minimum
- **Integration Tests**: Critical user paths
- **E2E Tests**: Happy paths + critical edge cases
- **Visual Tests**: All major components
- **Accessibility**: WCAG AA compliance

## 1. Unit Testing

### Component Testing

#### Character Card Example
```typescript
// tests/components/CharacterCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { mockCharacter } from '@/tests/fixtures/characters';

describe('CharacterCard', () => {
  it('renders character information correctly', () => {
    render(<CharacterCard character={mockCharacter} />);
    
    expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
    expect(screen.getByText(mockCharacter.description)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: mockCharacter.name })).toHaveAttribute(
      'src',
      mockCharacter.avatar
    );
  });

  it('displays consistency score with correct color', () => {
    render(<CharacterCard character={mockCharacter} />);
    
    const score = screen.getByText(`${mockCharacter.consistencyScore}%`);
    expect(score).toHaveClass('text-green-600'); // For scores > 80%
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<CharacterCard character={mockCharacter} onClick={handleClick} />);
    
    await user.click(screen.getByRole('article'));
    
    expect(handleClick).toHaveBeenCalledWith(mockCharacter);
  });

  it('shows loading skeleton when character is undefined', () => {
    render(<CharacterCard character={undefined} />);
    
    expect(screen.getByTestId('character-card-skeleton')).toBeInTheDocument();
  });

  it('displays character tags', () => {
    render(<CharacterCard character={mockCharacter} />);
    
    mockCharacter.traits.forEach(trait => {
      expect(screen.getByText(trait)).toBeInTheDocument();
    });
  });
});
```

#### Form Testing
```typescript
// tests/components/CharacterForm.test.tsx
describe('CharacterForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={vi.fn()} />);
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create character/i }));
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('validates personality trait ranges', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={vi.fn()} />);
    
    const opennessSlider = screen.getByRole('slider', { name: /openness/i });
    
    // Try to set invalid value
    fireEvent.change(opennessSlider, { target: { value: '150' } });
    
    expect(screen.getByText('Value must be between 0 and 100')).toBeInTheDocument();
  });

  it('saves draft on form change', async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();
    
    render(<CharacterForm onSubmit={vi.fn()} onSaveDraft={saveDraft} />);
    
    await user.type(screen.getByLabelText(/name/i), 'Test Character');
    
    // Debounced, so wait
    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Character' })
      );
    });
  });
});
```

### Hook Testing

```typescript
// tests/hooks/useCharacters.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCharacters } from '@/hooks/useCharacters';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCharacters', () => {
  it('fetches characters successfully', async () => {
    const { result } = renderHook(() => useCharacters(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0]).toHaveProperty('name');
  });

  it('handles error state', async () => {
    server.use(
      rest.get('/api/characters', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useCharacters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Store Testing

```typescript
// tests/stores/generationStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useGenerationStore } from '@/stores/generationStore';

describe('generationStore', () => {
  beforeEach(() => {
    useGenerationStore.setState({
      prompt: '',
      isGenerating: false,
      output: '',
      selectedCharacter: null,
    });
  });

  it('updates prompt', () => {
    const { result } = renderHook(() => useGenerationStore());

    act(() => {
      result.current.setPrompt('Test prompt');
    });

    expect(result.current.prompt).toBe('Test prompt');
  });

  it('handles generation lifecycle', async () => {
    const { result } = renderHook(() => useGenerationStore());

    // Start generation
    const generatePromise = act(async () => {
      await result.current.generate();
    });

    // Should be generating
    expect(result.current.isGenerating).toBe(true);

    await generatePromise;

    // Should have output
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.output).toBeTruthy();
  });
});
```

## 2. Integration Testing

### API Integration Tests

```typescript
// tests/integration/characterApi.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { characterAPI } from '@/api/character';

const server = setupServer(
  rest.get('/api/characters', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'Character 1' },
      { id: '2', name: 'Character 2' },
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Character API Integration', () => {
  it('fetches all characters', async () => {
    const characters = await characterAPI.getAll();
    
    expect(characters).toHaveLength(2);
    expect(characters[0].name).toBe('Character 1');
  });

  it('creates a character', async () => {
    const newCharacter = {
      name: 'New Character',
      description: 'Test description',
    };

    server.use(
      rest.post('/api/characters', async (req, res, ctx) => {
        const body = await req.json();
        return res(ctx.json({ id: '3', ...body }));
      })
    );

    const created = await characterAPI.create(newCharacter);
    
    expect(created.id).toBe('3');
    expect(created.name).toBe('New Character');
  });

  it('handles network errors gracefully', async () => {
    server.use(
      rest.get('/api/characters', (req, res) => {
        return res.networkError('Failed to connect');
      })
    );

    await expect(characterAPI.getAll()).rejects.toThrow('Network error');
  });
});
```

### Feature Flow Tests

```typescript
// tests/integration/generationFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationPage } from '@/pages/GenerationPage';
import { TestProviders } from '@/tests/TestProviders';

describe('Generation Flow Integration', () => {
  it('completes full generation flow', async () => {
    const user = userEvent.setup();
    
    render(
      <TestProviders>
        <GenerationPage />
      </TestProviders>
    );

    // Select character
    await user.click(screen.getByText('Select Character'));
    await user.click(screen.getByText('Cool Guy'));

    // Enter prompt
    await user.type(
      screen.getByPlaceholderText('Enter your prompt...'),
      'Create a funny meme about coding'
    );

    // Select template
    await user.click(screen.getByText('Drake Meme'));

    // Generate
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // Wait for streaming to complete
    await waitFor(() => {
      expect(screen.getByTestId('generation-output')).toHaveTextContent(
        /why did the programmer/i
      );
    }, { timeout: 5000 });

    // Save to library
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Saved to library')).toBeInTheDocument();
  });
});
```

## 3. End-to-End Testing

### Playwright E2E Tests

```typescript
// e2e/character-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Character Creation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Characters' }).click();
  });

  test('creates a new character', async ({ page }) => {
    // Navigate to creation
    await page.getByRole('button', { name: 'Create New Character' }).click();

    // Fill form
    await page.getByLabel('Name').fill('E2E Test Character');
    await page.getByLabel('Description').fill('Character created by E2E test');

    // Set personality
    await page.getByRole('slider', { name: 'Openness' }).fill('80');
    await page.getByRole('slider', { name: 'Humor' }).fill('90');

    // Add traits
    await page.getByRole('button', { name: 'Add Tag' }).click();
    await page.getByPlaceholder('Enter trait...').fill('funny');
    await page.keyboard.press('Enter');

    // Upload avatar
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/avatar.png');

    // Save
    await page.getByRole('button', { name: 'Create Character' }).click();

    // Verify creation
    await expect(page).toHaveURL(/\/characters\/[\w-]+/);
    await expect(page.getByText('E2E Test Character')).toBeVisible();
    await expect(page.getByText('Character created successfully')).toBeVisible();
  });

  test('generates content with character', async ({ page }) => {
    // Select existing character
    await page.getByText('Cool Guy').click();
    
    // Quick generate
    await page.getByRole('button', { name: 'Generate Content' }).click();
    
    // Enter prompt
    await page.getByPlaceholder('What would you like to create?').fill(
      'Make a meme about debugging'
    );

    // Generate
    await page.getByRole('button', { name: 'Generate' }).click();

    // Wait for generation
    await expect(page.getByTestId('streaming-output')).toBeVisible();
    await expect(page.getByText(/debugging/i)).toBeVisible({ timeout: 10000 });

    // Export
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByText('PNG').click();

    // Verify download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('meme');
  });
});
```

### Critical User Journeys

```typescript
// e2e/critical-paths.spec.ts
test.describe('Critical User Journeys', () => {
  test('first time user onboarding', async ({ page }) => {
    // Clear local storage to simulate first visit
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    // Should see onboarding
    await expect(page.getByText('Welcome to AI Content Studio')).toBeVisible();

    // Complete onboarding
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByLabel('Your Name').fill('Test User');
    await page.getByRole('button', { name: 'Next' }).click();

    // Create first character
    await expect(page.getByText('Create Your First Character')).toBeVisible();
    await page.getByRole('button', { name: 'Quick Create' }).click();

    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('meme creation workflow', async ({ page }) => {
    await page.goto('/generate');

    // Quick meme mode
    await page.getByRole('tab', { name: 'Meme' }).click();
    
    // Select template
    await page.getByAltText('Drake Meme Template').click();
    
    // AI suggestions
    await page.getByRole('button', { name: 'Suggest Text' }).click();
    await expect(page.getByText('Generating suggestions...')).toBeVisible();
    
    // Modify and create
    const topText = page.getByLabel('Top Text');
    await topText.clear();
    await topText.fill('When the code works first try');
    
    await page.getByRole('button', { name: 'Create Meme' }).click();
    
    // Share
    await page.getByRole('button', { name: 'Share' }).click();
    await page.getByText('Copy Link').click();
    
    await expect(page.getByText('Link copied!')).toBeVisible();
  });
});
```

## 4. Visual Regression Testing

### Component Visual Tests

```typescript
// tests/visual/components.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression - Components', () => {
  test('character card states', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=components-charactercard--all-states');
    
    await percySnapshot(page, 'Character Card - All States', {
      widths: [375, 768, 1280],
    });
  });

  test('generation interface', async ({ page }) => {
    await page.goto('/generate');
    
    // Default state
    await percySnapshot(page, 'Generation Interface - Default');
    
    // With character selected
    await page.getByText('Select Character').click();
    await page.getByText('Cool Guy').click();
    await percySnapshot(page, 'Generation Interface - Character Selected');
    
    // During generation
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.waitForTimeout(500); // Let animation start
    await percySnapshot(page, 'Generation Interface - Generating');
  });

  test('dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Toggle dark mode
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByText('Dark').click();
    
    await percySnapshot(page, 'Dashboard - Dark Mode');
  });
});
```

### Responsive Testing

```typescript
// tests/visual/responsive.spec.ts
test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'wide', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`dashboard at ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      
      await percySnapshot(page, `Dashboard - ${name}`);
    });

    test(`character creator at ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/characters/new');
      
      await percySnapshot(page, `Character Creator - ${name}`);
    });
  });
});
```

## 5. Performance Testing

### Web Vitals Monitoring

```typescript
// tests/performance/vitals.test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance - Web Vitals', () => {
  test('measures core web vitals', async ({ page }) => {
    await page.goto('/');

    const vitals = await page.evaluate(() =>
      new Promise((resolve) => {
        let cls = 0;
        let fid = 0;
        let lcp = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              cls += entry.value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              fid = entry.processingStart - entry.startTime;
            }
          }
        }).observe({ entryTypes: ['first-input'] });

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              lcp = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => {
          resolve({ cls, fid, lcp });
        }, 5000);
      })
    );

    // Assert thresholds
    expect(vitals.lcp).toBeLessThan(2500); // Good LCP
    expect(vitals.fid).toBeLessThan(100);  // Good FID
    expect(vitals.cls).toBeLessThan(0.1);  // Good CLS
  });
});
```

### Load Testing

```typescript
// tests/performance/load.test.ts
import { chromium } from '@playwright/test';

async function measureGenerationPerformance(concurrentUsers: number) {
  const results = [];
  const browser = await chromium.launch();

  const promises = Array.from({ length: concurrentUsers }, async (_, i) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const startTime = Date.now();
    
    await page.goto('/generate');
    await page.fill('[placeholder="Enter your prompt..."]', `Test prompt ${i}`);
    await page.click('button:has-text("Generate")');
    
    // Wait for generation to complete
    await page.waitForSelector('[data-testid="generation-complete"]', {
      timeout: 30000,
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    results.push(duration);
    await context.close();
  });

  await Promise.all(promises);
  await browser.close();

  return {
    avg: results.reduce((a, b) => a + b) / results.length,
    min: Math.min(...results),
    max: Math.max(...results),
    p95: results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)],
  };
}

test.describe('Load Testing', () => {
  test('handles concurrent generations', async () => {
    const results = await measureGenerationPerformance(10);
    
    expect(results.avg).toBeLessThan(5000);
    expect(results.p95).toBeLessThan(8000);
  });
});
```

## 6. Accessibility Testing

### Automated A11y Tests

```typescript
// tests/accessibility/a11y.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('dashboard has no accessibility violations', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('character creator is accessible', async ({ page }) => {
    await page.goto('/characters/new');
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
      },
    });
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Dashboard');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Characters');
    
    // Enter submenu
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/characters');
    
    // Tab to create button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Create New Character');
  });

  test('screen reader announcements', async ({ page }) => {
    await page.goto('/generate');
    
    // Start generation
    await page.fill('[placeholder="Enter your prompt..."]', 'Test prompt');
    await page.click('button:has-text("Generate")');
    
    // Check for live region updates
    const liveRegion = page.getByRole('status');
    await expect(liveRegion).toHaveText('Generating content...');
    
    // Wait for completion
    await expect(liveRegion).toHaveText('Generation complete');
  });
});
```

### Manual Testing Checklist

```typescript
// tests/accessibility/checklist.test.ts
test.describe('Manual Accessibility Checklist', () => {
  test.skip('manual checks required', async ({ page }) => {
    await page.goto('/');
    
    // This test serves as documentation
    const checklist = [
      'Can navigate entire app with keyboard only',
      'All interactive elements have focus indicators',
      'Color contrast meets WCAG AA standards',
      'Images have appropriate alt text',
      'Form labels are properly associated',
      'Error messages are announced to screen readers',
      'Skip links are present and functional',
      'Page has proper heading hierarchy',
      'ARIA labels are descriptive and accurate',
      'Loading states are announced',
      'Focus management after modal close',
      'Animations respect prefers-reduced-motion',
    ];
    
    console.log('Manual accessibility checks required:');
    checklist.forEach((check, i) => {
      console.log(`${i + 1}. [ ] ${check}`);
    });
  });
});
```

## 7. Test Data Management

### Fixtures

```typescript
// tests/fixtures/characters.ts
export const mockCharacter = {
  id: 'char-1',
  name: 'Cool Guy',
  description: 'A cool and funny character',
  avatar: '/avatars/cool-guy.png',
  personality: {
    openness: 80,
    conscientiousness: 60,
    extraversion: 90,
    agreeableness: 70,
    neuroticism: 30,
    humor: 85,
    formality: 20,
  },
  traits: ['funny', 'sarcastic', 'witty'],
  voice: {
    tone: 'casual',
    vocabulary: 'simple',
    catchphrases: ["That's what I'm talking about!"],
  },
  consistencyScore: 92,
  usage: {
    total: 324,
    lastUsed: new Date('2024-01-15'),
  },
};

export const mockCharacters = [
  mockCharacter,
  {
    ...mockCharacter,
    id: 'char-2',
    name: 'Hero Girl',
    description: 'A brave and inspiring character',
    avatar: '/avatars/hero-girl.png',
  },
];
```

### Test Factories

```typescript
// tests/factories/character.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Character } from '@/types/character';

export const characterFactory = Factory.define<Character>(() => ({
  id: faker.string.uuid(),
  name: faker.person.firstName(),
  description: faker.lorem.sentence(),
  avatar: faker.image.avatar(),
  personality: {
    openness: faker.number.int({ min: 0, max: 100 }),
    conscientiousness: faker.number.int({ min: 0, max: 100 }),
    extraversion: faker.number.int({ min: 0, max: 100 }),
    agreeableness: faker.number.int({ min: 0, max: 100 }),
    neuroticism: faker.number.int({ min: 0, max: 100 }),
    humor: faker.number.int({ min: 0, max: 100 }),
    formality: faker.number.int({ min: 0, max: 100 }),
  },
  traits: faker.helpers.arrayElements(
    ['funny', 'serious', 'creative', 'analytical', 'empathetic'],
    3
  ),
  voice: {
    tone: faker.helpers.arrayElement(['casual', 'formal', 'friendly']),
    vocabulary: faker.helpers.arrayElement(['simple', 'moderate', 'advanced']),
    catchphrases: [faker.lorem.sentence()],
  },
  consistencyScore: faker.number.int({ min: 70, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}));

// Usage
const testCharacter = characterFactory.build();
const multipleCharacters = characterFactory.buildList(5);
const customCharacter = characterFactory.build({ name: 'Specific Name' });
```

## 8. Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-focal
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - run: npm ci
      - run: npm run build
      
      - name: Percy Test
        run: npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:a11y
      
      - name: Upload a11y report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: a11y-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - run: npm ci
      - run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## 9. Test Scripts

### package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:visual": "percy exec -- playwright test visual",
    "test:a11y": "playwright test accessibility",
    "test:performance": "playwright test performance",
    "test:all": "npm-run-all test:unit test:integration test:e2e test:a11y",
    "test:ci": "npm run test:all -- --reporter=github"
  }
}
```

## 10. Testing Best Practices

### Do's
1. **Test user behavior**, not implementation details
2. **Use data-testid** for elements that are hard to query semantically
3. **Mock at the network level** with MSW, not module level
4. **Write descriptive test names** that explain the expected behavior
5. **Keep tests independent** - each test should run in isolation
6. **Use factories** for complex test data
7. **Test error states** and edge cases
8. **Run tests in parallel** when possible

### Don'ts
1. **Don't test third-party libraries** - trust they work
2. **Don't test implementation details** like state changes
3. **Don't use arbitrary waits** - use waitFor or expect assertions
4. **Don't skip flaky tests** - fix them
5. **Don't test styles directly** - use visual regression tests
6. **Don't mock everything** - test integration points
7. **Don't write brittle selectors** - prefer accessible queries

### Testing Checklist

Before marking a feature complete:
- [ ] Unit tests written for all components
- [ ] Integration tests for API calls
- [ ] E2E test for happy path
- [ ] Visual regression test added
- [ ] Accessibility test passing
- [ ] Performance budget met
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Empty states tested
- [ ] Mobile responsiveness tested

## Maintenance

### Weekly Tasks
- Review and fix flaky tests
- Update visual regression baselines
- Check test coverage trends
- Review performance metrics
- Update test documentation

### Monthly Tasks
- Audit and remove obsolete tests
- Update test dependencies
- Review and optimize CI pipeline
- Analyze test execution times
- Plan for new test scenarios