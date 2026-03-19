import re
import databutton as db
from fastapi import APIRouter
from pydantic import BaseModel
from app.libs.firebase_init import get_firestore_client

router = APIRouter(prefix="/journal-migration", tags=["migration"])

# ── Key patterns ─────────────────────────────────────────────────────────────
PATTERN_JOURNAL = re.compile(r"^journal_entry_(.+)_(\d{4}-\d{2}-\d{2})$")
PATTERN_WEEKLY  = re.compile(r"^weekly_review_(.+)_([a-f0-9\-]{36})$")
PATTERN_HABIT   = re.compile(r"^habit_definitions_(.+)$")


class MigrationResult(BaseModel):
    dry_run: bool
    journal_entries_found: int
    journal_entries_migrated: int
    journal_entries_skipped: int
    weekly_reviews_found: int
    weekly_reviews_migrated: int
    habit_definitions_found: int
    habit_definitions_migrated: int
    total_migrated: int
    errors: list[str]
    sample_firestore_paths: list[str]


def _run_migration(dry_run: bool) -> MigrationResult:
    """Core migration logic. If dry_run=True, no writes to Firestore."""
    firestore_db = get_firestore_client()

    all_files = db.storage.json.list()
    all_keys  = [f.name for f in all_files]

    errors: list[str] = []
    sample_paths: list[str] = []

    # Counters
    j_found = j_migrated = j_skipped = 0
    w_found = w_migrated = 0
    h_found = h_migrated = 0

    # ── Batch helper (commits every 400 ops, well within Firestore 500-op limit)
    batch = firestore_db.batch()
    batch_count = 0

    def maybe_commit():
        nonlocal batch, batch_count
        if batch_count >= 400:
            if not dry_run:
                batch.commit()
            batch = firestore_db.batch()
            batch_count = 0

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Journal entries
    # ─────────────────────────────────────────────────────────────────────────
    journal_keys = [k for k in all_keys if k.startswith("journal_entry_")]
    j_found = len(journal_keys)

    for key in journal_keys:
        m = PATTERN_JOURNAL.match(key)
        if not m:
            j_skipped += 1
            pass
            continue
        user_id, date = m.group(1), m.group(2)
        try:
            data = db.storage.json.get(key, default={})
            if not data:
                j_skipped += 1
                continue
            path = f"journal_entries/{user_id}/entries/{date}"
            if not dry_run:
                ref = (
                    firestore_db
                    .collection("journal_entries")
                    .document(user_id)
                    .collection("entries")
                    .document(date)
                )
                batch.set(ref, data)
                batch_count += 1
                maybe_commit()
            j_migrated += 1
            if len(sample_paths) < 5:
                sample_paths.append(path)
        except Exception as e:
            errors.append(f"journal/{key}: {str(e)[:200]}")
            pass

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Weekly reviews
    # ─────────────────────────────────────────────────────────────────────────
    weekly_keys = [k for k in all_keys if k.startswith("weekly_review_")]
    w_found = len(weekly_keys)

    for key in weekly_keys:
        m = PATTERN_WEEKLY.match(key)
        if not m:
            pass
            continue
        user_id, review_id = m.group(1), m.group(2)
        try:
            data = db.storage.json.get(key, default={})
            if not data:
                continue
            path = f"journal_entries/{user_id}/weekly_reviews/{review_id}"
            if not dry_run:
                ref = (
                    firestore_db
                    .collection("journal_entries")
                    .document(user_id)
                    .collection("weekly_reviews")
                    .document(review_id)
                )
                batch.set(ref, data)
                batch_count += 1
                maybe_commit()
            w_migrated += 1
            if len(sample_paths) < 8:
                sample_paths.append(path)
        except Exception as e:
            errors.append(f"weekly_review/{key}: {str(e)[:200]}")
            pass

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Habit definitions
    # ─────────────────────────────────────────────────────────────────────────
    habit_keys = [k for k in all_keys if k.startswith("habit_definitions_")]
    h_found = len(habit_keys)

    for key in habit_keys:
        m = PATTERN_HABIT.match(key)
        if not m:
            continue
        user_id = m.group(1)
        try:
            data = db.storage.json.get(key, default={})
            if not data:
                continue
            # Firestore requires a dict — wrap list if needed
            if isinstance(data, list):
                data = {"habits": data}
            path = f"habit_definitions/{user_id}"
            if not dry_run:
                ref = firestore_db.collection("habit_definitions").document(user_id)
                batch.set(ref, data)
                batch_count += 1
                maybe_commit()
            h_migrated += 1
            if len(sample_paths) < 10:
                sample_paths.append(path)
        except Exception as e:
            errors.append(f"habit_definitions/{key}: {str(e)[:200]}")
            pass

    # Final commit
    if not dry_run and batch_count > 0:
        batch.commit()

    total = j_migrated + w_migrated + h_migrated
    pass

    return MigrationResult(
        dry_run=dry_run,
        journal_entries_found=j_found,
        journal_entries_migrated=j_migrated,
        journal_entries_skipped=j_skipped,
        weekly_reviews_found=w_found,
        weekly_reviews_migrated=w_migrated,
        habit_definitions_found=h_found,
        habit_definitions_migrated=h_migrated,
        total_migrated=total,
        errors=errors,
        sample_firestore_paths=sample_paths,
    )


@router.post("/dry-run")
def migration_dry_run() -> MigrationResult:
    """Preview what would be migrated — no writes to Firestore."""
    return _run_migration(dry_run=True)


@router.post("/execute")
def migration_execute() -> MigrationResult:
    """Execute the migration — write all journal data from Riff storage to Firestore."""
    return _run_migration(dry_run=False)


class StatusResult(BaseModel):
    riff_journal_entries: int
    riff_weekly_reviews: int
    riff_habit_definitions: int
    firestore_users_with_journal: int
    firestore_journal_entries: int
    firestore_weekly_reviews: int
    firestore_habit_definitions: int


@router.get("/status")
def migration_status() -> StatusResult:
    """Compare record counts between Riff storage and Firestore."""
    firestore_db = get_firestore_client()
    all_files = db.storage.json.list()
    all_keys  = [f.name for f in all_files]

    # Riff counts
    riff_j = sum(1 for k in all_keys if PATTERN_JOURNAL.match(k))
    riff_w = sum(1 for k in all_keys if PATTERN_WEEKLY.match(k))
    riff_h = sum(1 for k in all_keys if PATTERN_HABIT.match(k))

    # Firestore counts — iterate subcollections per user
    user_docs = list(firestore_db.collection("journal_entries").list_documents())
    fs_users  = len(user_docs)
    fs_j = 0
    fs_w = 0
    for user_ref in user_docs:
        fs_j += len(list(user_ref.collection("entries").list_documents()))
        fs_w += len(list(user_ref.collection("weekly_reviews").list_documents()))

    fs_h = len(list(firestore_db.collection("habit_definitions").list_documents()))

    return StatusResult(
        riff_journal_entries=riff_j,
        riff_weekly_reviews=riff_w,
        riff_habit_definitions=riff_h,
        firestore_users_with_journal=fs_users,
        firestore_journal_entries=fs_j,
        firestore_weekly_reviews=fs_w,
        firestore_habit_definitions=fs_h,
    )
