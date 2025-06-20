# Wireframes - AI Content Studio

## 1. Dashboard (Home)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌──────────────────────────────────┐ ┌────────────────────────┐ │
│ │ AI Studio   │ │      🔍 Search everything...      │ │ 👤 John  🔔  ⚙️       │ │
│ └─────────────┘ └──────────────────────────────────┘ └────────────────────────┘ │
├─────────────────┬───────────────────────────────────────────────────────────────┤
│                 │                                                                 │
│ 📊 Dashboard    │  Welcome back, John! Here's your content overview              │
│                 │                                                                 │
│ 👥 Characters   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│   My Characters │  │ Generated   │ │ Active      │ │ Consistency │ │ Credits   │ │
│   Templates     │  │    1,247    │ │     8       │ │    92%      │ │  $12.50   │ │
│   Create New    │  │ This Month  │ │ Characters  │ │  Average    │ │ Remaining │ │
│                 │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│ ⚡ Generate     │                                                                 │
│   Quick Gen     │  Recent Characters                                              │
│   Templates     │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│   Batch Mode    │  │  😎    │ │  🦸    │ │  🤖    │ │  👨‍🎤   │                 │
│                 │  │ Cool   │ │ Hero   │ │ Bot    │ │Rocker  │                 │
│ 📁 Content      │  │ Guy    │ │ Girl   │ │ 3000   │ │ Dude   │                 │
│   Library       │  └────────┘ └────────┘ └────────┘ └────────┘                 │
│   Collections   │                                                                 │
│   Trash         │  Recent Content                            Quick Actions       │
│                 │  ┌─────────────────────────────────────┐ ┌─────────────────┐ │
│ 📈 Analytics    │  │ 🎭 "Why did the chicken..."       │ │ 🎬 New Video   │ │
│   Performance   │  │    Meme • Cool Guy • 2 hours ago   │ │                 │ │
│   Characters    │  ├─────────────────────────────────────┤ │ 🖼️ New Meme    │ │
│   Costs         │  │ 📝 "In this episode we discuss..." │ │                 │ │
│                 │  │    Script • Hero Girl • 5 hours ago │ │ 📱 Social Post │ │
│ ⚙️ Settings     │  ├─────────────────────────────────────┤ │                 │ │
│   Models        │  │ 🐦 "Just discovered that AI can..." │ │ 💬 Quick Chat  │ │
│   API Config    │  │    Tweet • Bot 3000 • Yesterday     │ │                 │ │
│   Preferences   │  └─────────────────────────────────────┘ └─────────────────┘ │
│                 │                                                                 │
└─────────────────┴───────────────────────────────────────────────────────────────┘
```

## 2. Character Creator

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Characters                           Create New Character      [Save]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌───────────────┐  Character Basics                                            │
│  │               │                                                               │
│  │   [Upload     │  Name: [________________________]                           │
│  │    Avatar]    │                                                               │
│  │               │  Description: [_____________________________________________]   │
│  │      OR       │               [_____________________________________________]   │
│  │               │                                                               │
│  │  Select Icon: │  Tags: [Funny] [Sarcastic] [+Add Tag]                        │
│  │   😎 🦸 🤖 👨‍🎤  │                                                               │
│  └───────────────┘  Voice: [Casual ▼]  Vocabulary: [Simple ▼]  Age: [25-35 ▼]  │
│                                                                                   │
│  Personality Traits                          Preview                              │
│  ┌─────────────────────────────────┐       ┌──────────────────────────────────┐ │
│  │ Openness         ████████░░ 80% │       │ "Hey there! I'm your new         │ │
│  │ Conscientiousness ██████░░░░ 60% │       │ character. Based on my traits,   │ │
│  │ Extraversion     █████████░ 90% │       │ I'm pretty outgoing and love     │ │
│  │ Agreeableness    ███████░░░ 70% │       │ making people laugh. Want to     │ │
│  │ Neuroticism      ███░░░░░░░ 30% │       │ hear a joke?"                    │ │
│  │                                  │       │                                  │ │
│  │ 🎭 Humor          ████████░░ 80% │       │ [Test Different Prompt]          │ │
│  │ 🎓 Formality      ██░░░░░░░░ 20% │       │                                  │ │
│  │ 💝 Empathy        ███████░░░ 70% │       └──────────────────────────────────┘ │
│  └─────────────────────────────────┘                                             │
│                                                                                   │
│  Background & Knowledge                                                           │
│  ┌────────────────────────┐ ┌────────────────────────┐ ┌─────────────────────┐ │
│  │ Occupation:            │ │ Interests:             │ │ Expertise:          │ │
│  │ [Stand-up Comedian  ] │ │ ☑ Comedy               │ │ ☑ Humor (Expert)    │ │
│  │                        │ │ ☑ Pop Culture          │ │ ☑ Social Media      │ │
│  │ Education:             │ │ ☑ Technology           │ │ ☑ Current Events    │ │
│  │ [Comedy School      ] │ │ ☐ Sports               │ │ ☐ Technical         │ │
│  │                        │ │ [+Add More]            │ │ [+Add More]         │ │
│  └────────────────────────┘ └────────────────────────┘ └─────────────────────┘ │
│                                                                                   │
│  Catchphrases & Speech Patterns                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ • "That's what I'm talking about!"                              [Remove] │    │
│  │ • "You know what's funny about that?"                           [Remove] │    │
│  │ • Often starts sentences with "So..."                            [Remove] │    │
│  │ [+ Add Catchphrase or Pattern]                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                   │
│                    [Use Template] [Import JSON]    [Cancel] [Create Character]    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Generation Interface

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Generate Content                                               History | Help    │
├─────────────────┬───────────────────────────────────────────────────────────────┤
│                 │                                                                 │
│ Type:           │  Character: [Cool Guy ▼]  Context: [Recent meme about AI ▼]    │
│ ○ Quick Text    │                                                                 │
│ ● Meme          │  Template: [Drake Meme ▼]                                      │
│ ○ Video Script  │  ┌─────────────────────────────────────────────────────────┐    │
│ ○ Social Post   │  │                     Drake Meme Template                   │    │
│ ○ Dialogue      │  │  ┌─────────────┐    ┌─────────────┐                      │    │
│                 │  │  │   [Top      │ 👎 │  [Top Text  │                      │    │
│ Model:          │  │  │    Image]   │    │  Goes Here] │                      │    │
│ ● Auto Select   │  │  └─────────────┘    └─────────────┘                      │    │
│ ○ llama3.1:8b   │  │                                                           │    │
│ ○ mistral:7b    │  │  ┌─────────────┐    ┌─────────────┐                      │    │
│ ○ gemma2:9b     │  │  │  [Bottom    │ 👍 │  [Bottom    │                      │    │
│                 │  │  │   Image]    │    │  Text Here] │                      │    │
│ Options:        │  │  └─────────────┘    └─────────────┘                      │    │
│ Creativity: 70% │  └─────────────────────────────────────────────────────────┘    │
│ ████████░░      │                                                                 │
│                 │  Prompt:                                                        │
│ Length: Medium  │  ┌─────────────────────────────────────────────────────────┐    │
│                 │  │ Create a meme about how AI is taking over creative      │    │
│ Variations: 3   │  │ jobs but still can't figure out how to draw hands      │    │
│                 │  │ properly. Make it relatable and funny.                   │    │
│ □ Keep Voice    │  └─────────────────────────────────────────────────────────┘    │
│ ☑ Use Memory    │                                                                 │
│ □ Strict Mode   │  Additional Context: [_____________________________________]    │
│                 │                                                                 │
│ Presets:        │                              [Clear] [Generate] [Generate All]  │
│ [Save Current]  │                                                                 │
│ • Viral Meme    ├─────────────────────────────────────────────────────────────────┤
│ • Quick Tweet   │                         Output (Streaming...)                     │
│ • Long Script   │  ┌─────────────────────────────────────────────────────────┐    │
│                 │  │ Version 1                                    [Copy] [Edit] │    │
│                 │  │ Top: "AI mastering every creative skill"                 │    │
│                 │  │ Bottom: "AI trying to draw a hand with 7 fingers"       │    │
│                 │  │                                                           │    │
│                 │  │ Version 2                                    [Copy] [Edit] │    │
│                 │  │ Top: "AI writing better novels than humans"              │    │
│                 │  │ Bottom: "AI drawing hands like a toddler with mittens"   │    │
│                 │  │                                                           │    │
│                 │  │ Version 3                                    [Copy] [Edit] │    │
│                 │  │ Top: "AI replacing all creative jobs by 2025"            │    │
│                 │  │ Bottom: "AI in 2025 still counting fingers"              │    │
│                 │  └─────────────────────────────────────────────────────────┘    │
│                 │                                                                 │
│                 │  [Save All] [Export] [Regenerate] [Create Images] [Share]       │
└─────────────────┴───────────────────────────────────────────────────────────────┘
```

## 4. Content Library

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Content Library                   [🔍 Search] [Filter ▼] [Sort: Recent ▼] [+New] │
├─────────────────┬───────────────────────────────────────────────────────────────┤
│ All Content     │  Showing 24 of 1,247 items                    [List] [Grid] 🔲  │
│ ├─ Memes (412)  │                                                                 │
│ ├─ Videos (89)  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│ ├─ Scripts (234)│  │ 🎭        │ │ 📝        │ │ 🐦        │ │ 🎬        │     │
│ └─ Social (512) │  │           │ │           │ │           │ │           │     │
│                 │  │  Drake    │ │  Blog:    │ │  Thread   │ │  YouTube  │     │
│ By Character    │  │  Meme     │ │  AI Future│ │  about    │ │  Script   │     │
│ ├─ Cool Guy(324)│  │           │ │           │ │  Web3     │ │           │     │
│ ├─ Hero Girl(198)│ ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤     │
│ └─ Bot 3000(89) │  │ Cool Guy  │ │ Hero Girl │ │ Bot 3000  │ │ Rocker    │     │
│                 │  │ 2 hrs ago │ │ 5 hrs ago │ │ Yesterday │ │ 2 days    │     │
│ Collections     │  │ ★★★★☆     │ │ ★★★★★     │ │ ★★★☆☆     │ │ ★★★★☆     │     │
│ ├─ Favorites    │  └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│ ├─ Templates    │                                                                 │
│ └─ Archive      │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│                 │  │ 🖼️        │ │ 💬        │ │ 📱        │ │ 🎭        │     │
│ Tags            │  │           │ │           │ │           │ │           │     │
│ #funny (623)    │  │  Distracted│ │  Chat     │ │  Instagram│ │  Success  │     │
│ #viral (234)    │  │  BF Meme  │ │  Convo    │ │  Post     │ │  Kid Meme │     │
│ #tech (189)     │  │           │ │           │ │           │ │           │     │
│ #trending (445) │  ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤     │
│                 │  │ Cool Guy  │ │ Hero Girl │ │ Cool Guy  │ │ Bot 3000  │     │
│                 │  │ 3 days    │ │ 3 days    │ │ 4 days    │ │ 5 days    │     │
│                 │  │ ★★★★★     │ │ ★★★★☆     │ │ ★★★★☆     │ │ ★★★☆☆     │     │
│                 │  └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│                 │                                                                 │
│                 │  [Load More...]                                                │
│                 │                                                                 │
├─────────────────┴───────────────────────────────────────────────────────────────┤
│ Selected: 0 items                          [Export] [Share] [Delete] [Duplicate] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5. Character Detail View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← Characters / Cool Guy                                [Edit] [Duplicate] [⋮]    │
├─────────────────┬───────────────────────────────────────────────────────────────┤
│ 😎              │  Performance Overview                                           │
│ Cool Guy        │  ┌───────────────────────────────────────────────────────────┐ │
│                 │  │ Consistency Score: 92%                                       │ │
│ Stats:          │  │ ████████████████████░░ ⬆ +2% from last week               │ │
│ Created: 3mo ago│  │                                                              │ │
│ Used: 324 times │  │ Content Generated     Usage by Type         Avg. Quality    │ │
│ Last: 2 hrs ago │  │ ┌─────────────────┐  ┌──────────────┐   ┌──────────────┐ │ │
│                 │  │ │   324 items     │  │ 🎭 Memes 45% │   │ ★★★★☆ 4.2/5 │ │ │
│ Quick Actions:  │  │ │ ▲ 12% this mo. │  │ 📝 Text  30% │   │ 👍 89% positive│ │
│ [💬 Chat Now]   │  │ └─────────────────┘  │ 🐦 Social 25%│   └──────────────┘ │ │
│ [⚡ Generate]   │  │                      └──────────────┘                     │ │
│ [📊 Full Stats] │  └───────────────────────────────────────────────────────────┘ │
│                 │                                                                 │
│ Personality:    │  Recent Content                                                 │
│ ████████░░ Open │  ┌─────────────────────────────────────────────────────────┐    │
│ ██████░░░░ Consc│  │ "Why did the AI go to therapy? It had too many layers!" │    │
│ █████████░ Extra│  │ Meme • 2 hours ago • 👍 156 likes                        │    │
│ ███████░░░ Agree│  ├─────────────────────────────────────────────────────────┤    │
│ ███░░░░░░░ Neuro│  │ "Just discovered my code has more bugs than features..." │    │
│                 │  │ Tweet • 5 hours ago • 🔄 42 retweets                     │    │
│ Traits:         │  ├─────────────────────────────────────────────────────────┤    │
│ #funny #sarcastic│ │ "In today's episode: Why keyboards fear programmers"     │    │
│ #relatable #witty│ │ Video Script • Yesterday • ⭐ Saved                       │    │
│                 │  └─────────────────────────────────────────────────────────┘    │
│ Voice:          │                                                                 │
│ Tone: Casual    │  Memories & Context                                [Manage]     │
│ Vocab: Simple   │  ┌─────────────────────────────────────────────────────────┐    │
│ Formal: 20%     │  │ 📌 High Priority                                         │    │
│                 │  │ • Loves making programming jokes                         │    │
│ Catchphrases:   │  │ • Has a running gag about debugging                      │    │
│ • "That's wild!"│  │ • Often references 90s pop culture                       │    │
│ • "So get this.."│ │                                                          │    │
│ • "No cap..."   │  │ 📅 Recent Interactions                                   │    │
│                 │  │ • User asked about AI ethics - responded with humor      │    │
│                 │  │ • Created viral meme about ChatGPT - 10k shares         │    │
│                 │  │ • Collaborated on tech podcast script                    │    │
│                 │  └─────────────────────────────────────────────────────────┘    │
└─────────────────┴───────────────────────────────────────────────────────────────┘
```

## 6. Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Analytics                     [Last 30 Days ▼] [Export PDF] [Schedule Report]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Overview                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Total Gen.   │ │ Active Chars │ │ Avg Quality  │ │ Total Cost   │          │
│  │   1,247      │ │      8       │ │    4.2/5     │ │   $45.32     │          │
│  │ ▲ 23%        │ │ ▲ 2 new      │ │ ▲ 0.3 pts    │ │ ▼ -12%       │          │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                   │
│  Generation Trends                          Model Performance                     │
│  ┌────────────────────────────────┐       ┌──────────────────────────────┐     │
│  │     📈 Content over Time       │       │ Model      Speed   Quality  $ │     │
│  │  300 ┤                         │       ├──────────────────────────────┤     │
│  │  250 ┤    ╱╲    ╱╲           │       │ llama3.1   45t/s   4.3/5   $$ │     │
│  │  200 ┤   ╱  ╲  ╱  ╲ ╱╲       │       │ mistral    38t/s   4.1/5   $  │     │
│  │  150 ┤  ╱    ╲╱    ╲╱ ╲      │       │ gemma2     52t/s   4.0/5   $  │     │
│  │  100 ┤ ╱               ╲     │       │ neural     41t/s   4.4/5   $$ │     │
│  │   50 ┤╱                 ╲    │       └──────────────────────────────┘     │
│  │    0 └───────────────────────┘       │                                     │
│  │      Week 1  2   3   4   5         │                                     │
│  └────────────────────────────────┘       │                                     │
│                                                                                   │
│  Character Performance                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Character    Usage   Consistency  Quality  Feedback  Trend               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ 😎 Cool Guy   324     92%         4.2/5    89% 👍    📈 +15%            │   │
│  │ 🦸 Hero Girl  198     88%         4.4/5    92% 👍    📈 +8%             │   │
│  │ 🤖 Bot 3000   156     94%         4.1/5    85% 👍    📊 stable          │   │
│  │ 👨‍🎤 Rocker     89      85%         3.9/5    78% 👍    📉 -5%             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  Cost Breakdown                            Popular Templates                      │
│  ┌────────────────────────────┐           ┌──────────────────────────────┐     │
│  │ 🟦 Ollama (Local)    72%  │           │ 1. Drake Meme         124 uses│     │
│  │ 🟨 LM Studio         18%  │           │ 2. Twitter Thread      98 uses│     │
│  │ 🟩 LocalAI           10%  │           │ 3. Blog Intro          87 uses│     │
│  │                           │           │ 4. Video Hook          76 uses│     │
│  │ Total: $45.32 this month │           │ 5. Instagram Caption   65 uses│     │
│  └────────────────────────────┘           └──────────────────────────────┘     │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Views

### Mobile - Generation Screen
```
┌─────────────────┐
│ ≡  Generate  👤 │
├─────────────────┤
│ Character       │
│ [Cool Guy    ▼] │
│                 │
│ Type            │
│ [🎭 Meme     ▼] │
│                 │
│ Prompt          │
│ ┌─────────────┐ │
│ │ Write a     │ │
│ │ funny meme  │ │
│ │ about...    │ │
│ └─────────────┘ │
│                 │
│ Options      ⚙️ │
│ ┌─────────────┐ │
│ │ Creativity  │ │
│ │ ████████░░  │ │
│ │ Length: Med │ │
│ └─────────────┘ │
│                 │
│ [Generate]      │
│                 │
├─────────────────┤
│ Output          │
│ ┌─────────────┐ │
│ │ Version 1   │ │
│ │ "Why did..."│ │
│ │ [Copy][Save]│ │
│ └─────────────┘ │
└─────────────────┘
```

### Tablet - Split View
```
┌─────────────────────────────────────┐
│ ☰ AI Studio        🔍  🔔  👤       │
├───────────────┬─────────────────────┤
│ Characters    │ Cool Guy        [✏️] │
│ > Cool Guy    │ ┌─────────────────┐ │
│   Hero Girl   │ │ 😎              │ │
│   Bot 3000    │ │ Consistency: 92%│ │
│               │ │ Used: 324 times │ │
│ Generate      │ └─────────────────┘ │
│ Content       │                     │
│ Analytics     │ Recent Content      │
│               │ • Drake Meme - 2h   │
│               │ • Tweet - 5h        │
│               │ • Video Script - 1d │
└───────────────┴─────────────────────┘
```