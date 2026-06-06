# Communication History Soft Delete + Student Summary Recompute Pilot

Date: 2026-06-06

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation commit: `a9e891c feat: soft delete communication history`

## Scope

This checkpoint closes the narrow Communication History Soft Delete + Student Summary Recompute Pilot.

The sprint allows mistaken communication history entries to be deleted safely without hard-deleting `call_logs`.

## Files Changed In Implementation

- `src/features/calls/services/callLogDeletion.ts`
- `src/features/students/StudentsPage.tsx`
- `tests/calls/callLogDeletion.test.ts`
- `tests/students/StudentsPageCallHistory.test.tsx`

## Behavior Added

- Communication history entries can be deleted from the student right card after confirmation.
- Deleted call logs are soft-deleted, not hard-deleted.
- Soft-deleted call logs no longer appear in communication history.
- Phone-card `Son sonuc` falls back through the existing active `call_logs` read model.
- Deletion with linked reminder or appointment is blocked in this MVP.

## Data Strategy

- `call_logs.deleted_at` is set.
- `call_logs.updated_at` is set.
- The call log row remains in the database.
- Existing `deleted_at` filtering keeps deleted logs out of active read models.
- `PhoneRecord` is not mutated.

## Student Summary Recompute Rules

After soft delete, the same student's latest communication summary is recomputed from remaining non-deleted `call_logs`:

- `last_call_result`
- `last_contacted_at`
- `last_contacted_phone_id`

Latest active call log ordering:

1. `call_time` descending
2. call log id descending as tie-breaker

If no active call logs remain:

- `last_call_result` becomes `not_called`
- `last_contacted_at` becomes `null`
- `last_contacted_phone_id` becomes `null`

## Reminder / Appointment Blocking Rule

If a call log has either of these fields, deletion is blocked:

- `created_reminder_id`
- `created_appointment_id`

No reminder or appointment cascade delete is performed.

No automatic detach is performed.

## Tests / Build Results

- `npm.cmd test -- --run` PASS
- 44 test file / 284 tests
- `npm.cmd run build` PASS
- Vite chunk size warning only

## Manual QA Acceptance Note

User reported localhost QA passed:

- Delete latest history entry: passed.
- Delete older history entry: passed.
- Deleted record disappears from communication history.
- Phone-card `Son sonuc` fallback passed.
- check / x behavior unchanged.
- Telefon 3+ and `+N / Daha az goster` unchanged.
- No runtime/console error reported.

## Explicit Non-Goals

- No hard delete
- No edit/correction
- No undo
- No schema migration
- No import/export format change
- No backup/restore behavior change
- No PhoneRecord mutation
- No reminder/appointment cascade delete
- No new call result values
- No phone_status repurpose

## Next Possible Discovery Topics

- Communication History Edit/Correction Discovery
- Reminder/Appointment linked deletion policy
- Undo/restore deleted communication history
- Export/report audit behavior for soft-deleted logs if needed
