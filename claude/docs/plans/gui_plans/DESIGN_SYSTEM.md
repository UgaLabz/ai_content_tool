# Design System - AI Content Studio

## Brand Identity

### Logo
- **Primary**: Stylized brain + pen icon
- **Wordmark**: "AI Content Studio" in custom typography
- **Favicon**: Simplified brain icon

### Tagline
"Where Characters Come to Life"

## Color Palette

### Primary Colors
```css
--primary-600: #6366F1;  /* Indigo - Main brand color */
--primary-500: #818CF8;  /* Hover states */
--primary-400: #A5B4FC;  /* Active states */
--primary-100: #E0E7FF;  /* Backgrounds */

--accent-500: #F59E0B;   /* Amber - CTAs and highlights */
--accent-400: #FBBF24;   /* Hover states */
```

### Neutral Colors
```css
--gray-950: #030712;     /* Pure black text */
--gray-900: #111827;     /* Primary text */
--gray-700: #374151;     /* Secondary text */
--gray-500: #6B7280;     /* Muted text */
--gray-300: #D1D5DB;     /* Borders */
--gray-100: #F3F4F6;     /* Backgrounds */
--gray-50:  #F9FAFB;     /* Subtle backgrounds */
```

### Semantic Colors
```css
--success-500: #10B981;  /* Green - Success states */
--warning-500: #F59E0B;  /* Amber - Warnings */
--error-500: #EF4444;    /* Red - Errors */
--info-500: #3B82F6;     /* Blue - Information */
```

### Dark Mode
```css
--dark-bg: #0F172A;      /* Main background */
--dark-surface: #1E293B; /* Card backgrounds */
--dark-border: #334155;  /* Borders */
```

## Typography

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-display: 'Cal Sans', 'Inter', sans-serif;
```

### Type Scale
```css
--text-xs: 0.75rem;      /* 12px - Badges, labels */
--text-sm: 0.875rem;     /* 14px - Secondary text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Emphasized body */
--text-xl: 1.25rem;      /* 20px - Section headers */
--text-2xl: 1.5rem;      /* 24px - Page headers */
--text-3xl: 2rem;        /* 32px - Main headers */
--text-4xl: 2.5rem;      /* 40px - Hero text */
```

### Font Weights
- Light: 300 (Decorative only)
- Regular: 400 (Body text)
- Medium: 500 (UI elements)
- Semibold: 600 (Headers)
- Bold: 700 (Emphasis)

## Spacing System

### Base Unit: 4px
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

## Component Design

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-500);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
```

#### Button Variants
- **Primary**: Main actions (Generate, Save)
- **Secondary**: Alternative actions (Cancel, Back)
- **Ghost**: Tertiary actions (Edit, Delete)
- **Danger**: Destructive actions (Delete permanently)

### Cards

#### Character Card
```css
.character-card {
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: 1rem;
  padding: var(--space-6);
  transition: all 0.2s;
  cursor: pointer;
}

.character-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-400);
}
```

### Form Elements

#### Input Fields
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  padding: var(--space-2) var(--space-3);
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
```

#### Textarea
- Auto-resize capability
- Character counter
- Markdown preview toggle
- Syntax highlighting for prompts

### Navigation

#### Sidebar
- Fixed width: 280px
- Collapsible to icon-only (64px)
- Nested menu support
- Active state indicators

#### Top Bar
- Height: 64px
- Search bar centered
- User menu right-aligned
- Breadcrumbs on desktop

## Icons

### Icon Library: Lucide React
- Consistent 24px grid
- 1.5px stroke width
- Rounded line caps

### Common Icons
- **Character**: User, UserCircle, Users
- **Generate**: Sparkles, Zap, Play
- **Content**: FileText, Image, Video
- **Settings**: Settings, Sliders, Cog
- **Analytics**: BarChart, TrendingUp, Activity

## Animations

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Loading States
- Skeleton screens for content
- Pulsing animation for placeholders
- Progress bars for long operations
- Spinners for quick loads

### Micro-interactions
- Button hover effects
- Card lift on hover
- Smooth accordion expansions
- Tooltip fade-ins

## Layout Principles

### Grid System
- 12-column grid
- 24px gutters
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: 1024px - 1280px
  - Wide: > 1280px

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### Page Structure
1. **Sidebar** (collapsible)
2. **Main Content** (scrollable)
3. **Right Panel** (optional, for details/preview)

## Accessibility

### Focus States
- 3px outline with 2px offset
- High contrast color
- Visible on all interactive elements

### Color Contrast
- WCAG AA compliance minimum
- AAA for essential text
- Color-blind friendly palette

### Keyboard Navigation
- Tab order follows visual hierarchy
- Skip links for main content
- Keyboard shortcuts panel

## Component Library

### Core Components
1. **Button** - All variants and states
2. **Input** - Text, number, select, checkbox
3. **Card** - Content, character, stat cards
4. **Modal** - Dialog, drawer, popover
5. **Navigation** - Sidebar, tabs, breadcrumbs
6. **Feedback** - Toast, alert, progress
7. **Data Display** - Table, list, grid
8. **Charts** - Line, bar, pie charts

### Composite Components
1. **CharacterCard** - Avatar, name, traits
2. **GenerationForm** - Prompt, options, submit
3. **ContentPreview** - Output with actions
4. **StatsDashboard** - Metrics overview
5. **TemplateSelector** - Grid with previews

## Responsive Design

### Mobile First
- Touch-friendly tap targets (44px min)
- Swipe gestures for navigation
- Bottom sheet patterns
- Simplified layouts

### Breakpoint Behaviors
- **Mobile**: Stack everything vertically
- **Tablet**: 2-column layouts, collapsible sidebar
- **Desktop**: Full 3-column layouts
- **Wide**: Maximize content area

## Theme Customization

### CSS Variables
All colors, spacing, and typography use CSS variables for easy theming:

```css
:root {
  --brand-primary: var(--primary-600);
  --text-primary: var(--gray-900);
  --bg-primary: white;
  /* ... etc */
}

[data-theme="dark"] {
  --text-primary: var(--gray-100);
  --bg-primary: var(--dark-bg);
  /* ... etc */
}
```

### User Preferences
- Light/Dark/System theme
- Compact/Comfortable/Spacious density
- Font size adjustment
- Reduced motion option