# TradingBait – Claude Code Context

## Project Overview
Full-stack trading journal app. React/TypeScript frontend, Python/FastAPI backend, Firestore database.

## Migration: db.storage → Firestore (Tier 3) — COMPLETE

All `db.storage` (Databutton) calls are being replaced with Firebase/Firestore equivalents.

### Firebase Init Pattern
```python
from firebase_admin import firestore
from app.libs.firebase_init import initialize_firebase

initialize_firebase()
db_firestore = firestore.client()
```

### Common Firestore Patterns
```python
# Get document
doc = db_firestore.collection("collection").document(doc_id).get()
data = doc.to_dict()  # None if not found

# Set document
db_firestore.collection("collection").document(doc_id).set(data)

# Update document
db_firestore.collection("collection").document(doc_id).update({"field": value})

# Delete document
db_firestore.collection("collection").document(doc_id).delete()

# Query
results = db_firestore.collection("collection").where(
    filter=firestore.FieldFilter("field", "==", value)
).stream()

# Stream all docs
for doc in db_firestore.collection("collection").stream():
    data = doc.to_dict()
```

### Collection Structure
- `discount_codes/{discount_id}` — discount records
- `discount_codes_deleted/{discount_id}` — soft-deleted discounts (audit trail)
- `early_access/{email}` — early access signups (email as doc ID)
- `ai_coach_notifications/{email}` — AI coach notification signups
- `subscriptions/{user_id}` — admin-managed subscription records
- `infrastructure_failures/{uuid}` — logged subscription verification failures
- `_health_probes/{id}` — infrastructure health check probes
- `analytics_events/{date}/events/{uuid}` — user activity events by date
- `analytics_metrics/{date}` — pre-computed daily user metrics
- `users/{user_id}/trader_profiles/current` — coaching profiles
- `users/{user_id}/assessment_history/{profile_id}` — assessment history
- `users/{user_id}/journal_entries/{date}` — journal entries (canonical path)
- `users/{user_id}/habits/{id}` — habit tracking data
- `users/{user_id}/evaluations/{eval_id}/trades/{trade_id}` — trades

---

## Migration Status — ALL TIER 3 COMPLETE ✅

| Module | Calls | Status |
|--------|-------|--------|
| discount_management | 17 | ✅ Done |
| historical_analytics | 10 | ✅ Done |
| coaching_profiles | 8 | ✅ Done |
| infrastructure_health | 6 | ✅ Done |
| early_access_signup | 6 | ✅ Done |
| libs/journal_migration | 5 | ✅ Done |
| admin_early_access | 4 | ✅ Done |
| insights_behavioral | 3 | ✅ Done |
| ai_coach_notifications | 3 | ✅ Done |
| admin | 3 | ✅ Done |
| trial_migration_script | 2 | ✅ Done (was already Firestore; string ref cleaned) |
| insights_trading | 2 | ✅ Done |
| journal_migration (api) | 1 | ✅ Done (already retired stub) |
| journal_cleanup | 1 | ✅ Done (already retired stub) |
| comprehensive_pattern_analysis | 1 | ✅ Done |

**Remaining db.storage references (NOT Tier 3):**
- `app/internal/dbapi.py` — internal Databutton plumbing, not a Tier 3 target
- `app/internal/mw/auth_mw.py` — references `databutton_app_state`, not db.storage

---

## Notes
- `sanitize_storage_key()` helpers are no longer needed after migration — remove them.
- No separate index collections needed; use Firestore queries on `code` field instead.
- Soft deletes: move doc to `*_deleted` collection, then delete from original.
- Already-migrated reference modules: `pattern_analysis`, `trade_management`, `file_analysis`.
