# 📋 RECOVERY B-PREPARE REPORT (36 MISSING QUESTIONS ONLY)

## 1. Summary Metrics
- **Total Missing Questions Prepared**: 36
- **Original Source Question IDs Preserved**: 36 / 36 (100%)
- **Proposed Target IDs Overlapping Existing Target**: 0
- **INSERT Candidates (No Historical Answers)**: 27 (`SAFE_NEW_ROW_REQUIRED`)
- **INSERT Candidates (Has Historical Answers)**: 9 (`PROTECTED_NEW_ROW_REQUIRED`)
- **Unresolved Rows**: 0

## 2. Protected Questions (9 Rows) Safety Note
- The 9 questions with historical answers use their **ORIGINAL VPS SOURCE QUESTION ID** as the proposed target ID.
- Historical student answers in `answers` table remain 100% untouched (0 UPDATEs / 0 DELETEs / 0 INSERTs against `answers`).
- Importing these 9 rows with preserved source IDs will restore referential integrity for their student submissions.

## 3. Generated Artifacts
- **SQL Insert Plan**: `missing_questions_insert_plan.sql` (36 INSERTs - UNEXECUTED ARTIFACT ONLY)
- **Audit File**: `missing_questions_insert_audit.csv` (36 Rows)
- **Report File**: `recovery_b_preparation_report.md`

## 4. Execution & Governance Status
- **STATUS**: `PREPARED_FOR_HUMAN_REVIEW`
- **EXECUTION**: `NOT_EXECUTED`
- **DATABASE_MUTATIONS**: `0`
