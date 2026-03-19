# TradingBait — Antigravity AI Rules

## What This Is
TradingBait is a trading journal and performance analytics SaaS for 
professional traders. Core loop: import trades → journal → get 
AI-driven insights to improve performance. Subscription-based with 
Stripe billing and a trial flow.

## Firebase Project
Project ID: trade-pulse-6970e
Auth: Firebase Authentication
Database: Firestore
Hosting: Firebase Hosting

## Current Priority (Next 30 Days)
1. Stabilise the app — fix existing bugs and errors before adding anything new
2. Add the AI coaching layer — Karl, Sophie, and Marcus (see AI Coach section below)

## Core Stack
- Frontend: React
- Backend: Firebase / Firestore
- Payments: Stripe
- AI: Claude API (Anthropic)
- Auth: Firebase Auth

## Firestore Structure
trader_profiles/{userId}
  - profile: "{...trader profile JSON}"
  - session_id: "..."
  - conversation_type: "karl / sophie / marcus"
  - coaching_tone: "direct / supportive"

sessions/{userId}/{date}
  - agent: "Karl / Sophie / Marcus"
  - summary: "{...}"

marcus_logs/{userId}/{date}
  - categories: [...]
  - entry: "..."
  - significance: "low / medium / high"

journal_entries/{userId}/entries/{date}
  - mood, habits, intentions, notes

## AI Coach — Karl, Sophie, Marcus
Three specialised coaching agents, each with distinct personality 
and data access:

KARL — General Trading Coach
- Pre-session preparation and daily debrief
- Direct, serious, process-driven
- Reads: trader profile, sessions, Marcus logs, journal, trading data, coaching tone
- Never invents risks not supported by real data

SOPHIE — Psychology Coach
- Emotional processing on demand
- Warm, soft, deep listener
- Reads: trader profile, sessions, Marcus logs, journal, coaching tone
- Never discusses technical analysis or charts
- Never gives a plan — guides trader to build their own

MARCUS — The Logbook
- Life context capture only
- Calm, neutral, non-judgmental
- Reads: trader profile, coaching tone only
- Logs entries as structured JSON with categories and significance level
- Six categories: Finances, Relationships, Work, Health, 
  Major Life Transitions, Mindset Shifts

## AI Rules
- Always stabilise before adding features
- Never remove existing functionality without explicit instruction
- When fixing a bug, explain what caused it before fixing it
- When adding a feature, confirm the approach before writing code
- Keep components clean — no bloated files
- If something is half-built, flag it before touching it
- Never hardcode user IDs or sensitive data
- Always handle loading and error states in UI components

## What Already Works
- Trade import with AI parsing
- FIFO P&L calculation
- Trading journal with mood, habits, intentions
- Weekly review and intentions
- Analytics — equity curve, heatmaps, KPI cards
- Stripe subscriptions and billing
- Firebase auth and Firestore
- Admin dashboard
- PDF export

## What Is Half-Built / Needs Attention
- Conversational AI coach — scaffolding exists, not fully built
- cTrader integration — removed, check for dead code
- Some large complex pages may need refactoring

## How To Work With Me
- One thing at a time — stabilise first, then build
- Explain what you're doing and why before making changes
- Flag any dead code or half-built features you encounter
- If a change touches Stripe or auth, always confirm before proceeding
- Keep me informed of any Firestore structural changes
```

---

Create the file at exactly this path in your project:
```
.idx/airules.md