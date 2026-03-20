# TradingBait — Claude Code Workspace

This file is automatically loaded at the start of every Claude Code session. It is the single source of truth for how Claude should understand and operate within this project.

---

## Project Overview

TradingBait is a trading journal and performance analytics SaaS for professional traders. Core loop: import trades → journal → get AI-driven insights. Subscription-based with Stripe billing and a trial flow.

| | |
|---|---|
| **Repository** | https://github.com/EdgarTradea/TradingBait |
| **Firebase Project** | trade-pulse-6970e |
| **Frontend** | React + TypeScript + Vite |
| **Backend** | Python + FastAPI (60+ API modules) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **File Storage** | Firebase Cloud Storage |
| **Payments** | Stripe |
| **AI** | Claude API (Anthropic) |

---

## Current Priority

1. **Set up environment variables** — .env file with all API keys
2. **Run locally and test** — verify core features work end to end
3. **Deploy to Firebase Hosting**
4. **Implement AI coaching layer** — Karl, Sophie, Marcus

---

## Migration Status

### Done — db.storage fully removed ✅
- Tier 1 (8 core modules) — fully migrated to Firestore
- Tier 2 (15 secondary modules) — fully migrated to Firestore
- Tier 3 (15 remaining modules) — fully migrated to Firestore (completed 2026-03-20)
- cTrader dead code — fully removed
- 81 debug print statements — removed
- 41 silent UI errors — replaced with toast notifications
- Static assets — bundled into frontend

**No db.storage references remain in any API module.** Only `app/internal/dbapi.py` and `app/internal/mw/auth_mw.py` retain Databutton internal plumbing — these are not migrated modules.

---

## Firestore Structure

```
users/{userId}
  -- preferences/
  -- subscription/
     -- trial
     -- usage
     -- stripe
  -- habits/
  -- moods/
  -- journal/{date}
  -- weekly_intentions/{week_start_date}
  -- evaluations/{evalId}/trades/
  -- coaching_sessions/
  -- educational_content/
  -- ai_parse_results/
  -- audit_log/
  -- gdpr_audit/
  -- data_exports/
  -- admin_audit/
  -- review_schedule/
     -- weekly
     -- monthly

system/health_check
system/connectivity_test
system/trial_health
support_tickets/{id}
traffic_summaries/{date}_{hour}
traffic_detailed/{date}_{hour}
traffic_sessions/{date}_{hour}
screenshots/{userId}/files/{id}
journal_entries/{userId}/entries/{date}
```

---

## AI Coaching Layer

Three specialised agents with distinct personalities. System prompts are fully designed — implementation pending.

| Agent | Role | Personality | Data Access |
|-------|------|-------------|-------------|
| Karl | Pre-session prep + debrief | Direct, serious, process-driven | Everything |
| Sophie | Emotional processing | Warm, soft, listener | Profile, sessions, Marcus logs, journal |
| Marcus | Life context logger | Calm, neutral | Profile + coaching tone only |

Implementation checklist:
- [ ] Migrate coaching_profiles to Firestore (Tier 3)
- [ ] Replace JournalCoachingPanel.tsx generic insights with three Claude API calls
- [ ] Wire Karl, Sophie, Marcus system prompts to backend
- [ ] Connect six data variables to Karl
- [ ] Connect five variables to Sophie (no trading data)
- [ ] Connect Marcus LOG_COMPLETE signal to Firestore write

---

## Development Rules

### Before making any change
- Read the relevant file first — understand what it does before touching it
- Explain the cause of any bug before fixing it
- Propose the approach for new features before writing code
- List every file that will be modified before making changes
- Wait for explicit approval before executing

### Migration rules
- Always verify with grep that db.storage references are actually gone after each migration
- Never assume a migration is complete — confirm with a search
- Firestore paths must follow the existing users/{userId}/... schema
- No logic changes during migration — only the storage layer changes

### Autohealing rules
- When an error occurs, diagnose the root cause before attempting a fix
- Never apply the same fix twice — if it didn't work, find a different approach
- If a migration breaks something, roll back and report before trying again
- Always check for and remove dead helper functions left behind after migration (sanitize_storage_key, get_user_*_key patterns)
- Always remove unused imports after removing the code that used them

### Critical protection rules — ALWAYS confirm before touching these
- Stripe billing code (stripe_webhooks, stripe_integration, user_billing)
- Firebase Auth flows (auth.ts, auth_mw.py, UserGuard)
- Any file that modifies or deletes user data
- Any schema changes to existing Firestore collections

### Code quality rules
- No bloated files — flag anything over 1000 lines before editing
- No hardcoded user IDs or API keys
- Always handle loading and error states in UI components
- Never remove existing functionality unless explicitly instructed
- Remove debug print() statements whenever encountered

---

## Slash Commands

### /prime
Run at the start of every session. Claude will:
1. Read this CLAUDE.md
2. Check current migration status
3. Summarise what's done, what's remaining, and what the next task is
4. Confirm readiness to proceed

### /status
Report current state:
- Which Tier 3 modules are migrated vs remaining
- Any known issues or blockers
- Next recommended action

### /migrate [module_name]
Migrate a specific db.storage module to Firestore:
1. Read the current file
2. List all db.storage calls and their Firestore equivalents
3. Identify dead code to remove
4. Wait for approval
5. Execute and verify with grep

### /verify
Run a full grep scan across the codebase and report:
- Any remaining db.storage references
- Any remaining import databutton statements
- Any remaining print() debug statements

### /deploy
Walk through the deployment checklist:
1. Verify environment variables are set
2. Run frontend build
3. Run backend dependency check
4. Deploy to Firebase Hosting
5. Verify the deployed app is live

---

## Environment Variables Required

Never commit these to GitHub. Set in .env file.

| Variable | Purpose |
|----------|---------|
| FIREBASE_ADMIN_SDK_CREDENTIALS | Backend Firebase Admin SDK |
| FIREBASE_CLIENT_CONFIG | Frontend Firebase Web SDK |
| ANTHROPIC_API_KEY | Claude API for Karl, Sophie, Marcus |
| STRIPE_SECRET_KEY | Stripe subscriptions and billing |
| STRIPE_WEBHOOK_SECRET | Verifying Stripe webhook payloads |
| SMTP_HOST / PORT / USER / PASS | Welcome and support emails |

---

## Session Workflow

1. Run /prime to load context and confirm current state
2. Use /migrate [module] for Tier 3 migrations
3. Use /verify after each migration batch to confirm clean state
4. Commit to GitHub after each completed tier or major change
5. Use /deploy when ready to go live
