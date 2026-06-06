# Phone-Level Outcome Read Model Pilot

Date: 2026-06-06

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation commit:

`5677377 feat: show latest phone call outcomes`

## Scope

This checkpoint closes the Phone-Level Outcome Read Model Pilot implementation.

The sprint added a read-only latest call outcome indicator to the student right-card phone cards. The indicator is shown for visible phone cards, including Telefon 1, Telefon 2, and Telefon 3+ extra phones.

## Files Changed In Implementation

- `src/features/calls/services/callHistoryReader.ts`
- `src/features/students/StudentsPage.tsx`
- `tests/students/StudentsPagePhoneSelection.test.tsx`

## Behavior Added

- Each visible phone card can show `Son sonuç: <latest call result label>`.
- If there is no call log for that phone, the card shows `Son sonuç: Yok`.
- The behavior works for Telefon 1/2 and Telefon 3+.
- The indicator is read-only and does not replace existing phone controls.

## Data / Read Model Strategy

The source of truth is existing `call_logs`.

Latest phone outcome is derived in this order:

1. `contacted_phone_id`
2. `phone_snapshot.phone_id`
3. `phone_id`
4. normalized phone number fallback

The latest result is selected from the most recent call log for the matching phone.

## Tests / Build Results

- `npm.cmd test -- --run` PASS
- 43 test files / 276 tests
- `npm.cmd run build` PASS
- Vite chunk size warning only; build successful

## Product Acceptance Note

User accepted the behavior.

The existing right-card ✓ / x controls stay for now:

- ✓ remains the current contact/selected call phone affordance.
- x remains the wrong number / unused affordance.

Future simplification of ✓ / x is a separate discovery topic.

## Explicit Non-Goals

- No schema migration
- No import/export changes
- No new call result values
- No `phone_status` repurpose
- No `PhoneRecord` mutation for phone-level outcomes
- No communication history delete/edit behavior
- No ✓ / x simplification in this sprint

## Next Possible Discovery Topics

- Phone Action Simplification Discovery
- Communication history delete/correction
- Phone-level outcome persistence/export only if product requires
