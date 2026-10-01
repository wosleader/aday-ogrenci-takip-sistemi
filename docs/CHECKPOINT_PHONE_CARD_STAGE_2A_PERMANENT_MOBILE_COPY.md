# Product Decision Checkpoint - Phone Card Stage 2A - Permanent Mobile Copy Control

## State / Evidence Boundary

- Branch: `sprint-9-2-multi-phone-architecture-plan`.
- Discovery repository baseline: `7c47af4c6fef449ee68b22a2de3ecb2497f0b0e2`.
- Discovery: `COMPLETE`.
- Strategy Review: `PASS WITH NON-BLOCKING NOTES` (discovery/technical recommendation review, not a completed implementation review).
- Product Decision: `USER APPROVED`.
- Implementation: `NOT STARTED`.
- Docs checkpoint: `COMMITTED / PUSHED`.
- Checkpoint SHA: `ddd42253f7f3c10875afb32da24f2f2dcca745cf`.
- Production: `NOT STARTED`; Vault: `NOT STARTED`; `FULLY CLOSED: NO`.
- Stage 2A tests/build/browser QA: `NOT RUN`; the QA matrix below is a future acceptance plan, not executed evidence.
- This activates only permanent mobile copy control, not the historical full Phone Card Stage 2 package. Stage 1 and previously closed workstreams remain preserved.

## Discovery Findings / Preferred Direction

The existing copy button is mounted beside a non-empty displayed phone value. Its wrapper reserves `18x18 px` with `flex: 0 0 18px`; React `isCopyControlVisible` controls inline visibility and `aria-hidden`. Hover/focus reveals it, mouseleave/external blur schedules hiding after `200ms`, and the successful Check feedback cycle currently hides it after `200ms`. Mobile copy behavior exists, but permanent mobile visibility does not.

Preferred direction: React viewport-aware derived visibility for both visual visibility and `aria-hidden`. A CSS-only visibility override is not sufficient/safe because it can leave a visually visible button under an `aria-hidden` ancestor. Preserve the same control, click paths, sequence refs, coordinator and lifecycle cleanup; do not create a competing copy path or replace the number element unnecessarily.

## User-Approved Behavior Contract

### Mobile `<=640px`

- Existing copy icon remains permanently visible beside the phone number.
- Existing `18x18 px` geometry is unchanged; enlarging the touch target is out of scope.
- Each displayed-number tap continues to copy once through the existing `copyPhoneNumber()` path.
- Each copy-icon tap copies once through that same existing path.
- Successful copy preserves approximately `200ms` of Check / `Kopyalandı` feedback.
- After feedback, Check returns to a visible Copy icon; the control does not disappear.
- Mouseleave/blur must not hide the mobile control. No phone value means no copy control, as before.

### Desktop `>=641px`

- Stage 1 corrected behavior remains unchanged: single click is inert; the second qualifying click within `400ms` copies once.
- Same-element, phoneId and exact-value matching, coordinator cancellation and triple-click guard are preserved.
- Copy icon retains existing hover/focus behavior and keyboard-accessible fallback.
- Do not restore native dblclick dependency or introduce duplicate copy calls.

### Copy Semantics

- Copy the displayed value exactly, without normalization.
- No DB/IndexedDB, call-log, phone-status or selection mutation.
- Clipboard unavailable/rejected preserves existing no-crash handling.
- Drawer, phone actions, More/outcome menus and selection remain isolated from copy interactions.

## Accessibility Boundary

- Mobile visual visibility and accessibility visibility must use the same derived result; a visible mobile button must not remain `aria-hidden`.
- Discovery identified a focused button beneath a wrapper that timers can hide. The generic hidden/focused warning is not resolved by this docs decision.
- Desktop hidden copy-control `aria-hidden` / focused debt remains separate and unresolved; do not claim a complete accessibility fix.
- Only directly necessary minimal semantics for permanent mobile visibility are accepted; broad/unrelated accessibility refactoring is out of scope.
- Resize across `640/641` and focus retention must be regression-checked without changing desktop copy semantics.

## Expected Implementation Scope

- `src/features/students/StudentsPage.tsx`.
- `tests/students/StudentsPagePhoneSelection.test.tsx`.
- `src/styles/global.css`: `NOT CURRENTLY REQUIRED`. If implementation evidence requires it or any other file, `STOP` and obtain approval before expanding scope.

## Expected QA / Acceptance - Not Yet Run

- Required viewports: `390x844`, `640x800`, `641x800`, `1440x900`.
- Mobile initial permanent icon without hover/focus; number tap one clipboard write; icon tap one clipboard write.
- Successful Check returns to visible Copy; mouseleave/blur do not hide it; feedback timers and unmount cleanup remain sound.
- `640px` remains mobile and `641px` desktop, including resize transitions.
- Desktop single-click inert, two-click copy, native dblclick duplicate prevention and triple guard remain unchanged.
- Cross-phone/control cancellation, drawer/phone-action/outcome isolation and phone identity/value guards are preserved.
- Keyboard fallback and clipboard unavailable/rejected no-crash behavior are preserved.
- Visible focused mobile control is not `aria-hidden`; verify keyboard focus and breakpoint transitions.
- No document-level horizontal overflow or collision with the existing action row. Preserve existing phone-slot identity and layout.
- Existing desktop hide/success assertions should explicitly use desktop width; add mobile permanent-visibility assertions rather than weakening desktop coverage.

## Explicit Out of Scope / Roadmap Preservation

- Mobile Ara button, `tel:` navigation, Turkish phone normalization and invalid-number call behavior.
- New mobile action layout, broader Phone Card redesign and WhatsApp outbound reconnect.
- Phone schema/data changes, call-log semantics, reminder/appointment changes, import/export/backup/restore and package/dependency changes.
- Touch-target enlargement and broad/unrelated accessibility refactoring.
- Historical full Stage 2: `PARTIALLY ACTIVATED AS STAGE 2A ONLY`; broader Stage 2 remains `NOT ACTIVE`, with no approved broader Product Decision.
- Smart Operational Helpers: `NOT IMPLEMENTED / BACKLOG / NOT ACTIVE`; `NEXT AFTER STAGE 2A FULL CLOSURE`, with separate explicit user activation required.
- WhatsApp Outbound Reconnection: `HOLD / INACTIVE`; no reopening without a new explicit user instruction.

## Next Gate

`PHONE CARD STAGE 2A IMPLEMENTATION PROMPT PREPARATION`

Implementation remains `NOT STARTED` and requires separate authorization after implementation-prompt preparation. No server/5173, browser storage, VDS/production or vault operations are part of this checkpoint. `dev-server.log` must remain unread and untouched.
