# Checkpoint - Phone-Level Call Outcome Tracking + Compact Phone Card UI Polish

Date: 2026-06-19

Branch: `sprint-9-2-multi-phone-architecture-plan`

Checkpoint type: docs-only closure

Implementation HEAD: `f7eccc2 feat: add phone-level call outcome tracking`

UI polish HEAD: `667d501 fix: polish phone outcome card menu layout`

Current safe HEAD: `667d501 fix: polish phone outcome card menu layout`

Working tree expectation: only `?? dev-server.log`

## 1. Checkpoint Summary

Phone-level call outcome tracking and the compact phone card UI polish are closed as of `667d501`.

The implementation adds per-phone outcome state to the right-card phone cards and then polishes the visual layout into a compact three-row structure. The outcome menu is rendered with robust portal/fixed positioning so it is not clipped by nearby right-card sections.

## 2. Product Behavior Implemented

Visible outcome options:

- Aranmadı
- Cevap Yok
- Meşgul
- Kapalı
- Görüşüldü
- Yanlış Numara
- Kullanılmıyor

Internal mapping:

- `not_called` -> Aranmadı
- `no_answer` -> Cevap Yok
- `busy` -> Meşgul
- `closed` -> Kapalı
- `reached` -> Görüşüldü
- `wrong_number` -> Yanlış Numara
- `unused` -> Kullanılmıyor

Behavior:

- Every phone can have its own phone-level outcome.
- Existing or legacy phones without `call_outcome` fall back to Aranmadı.
- Manual Aranmadı selection is a real reset and updates `call_outcome_updated_at`.
- Same number in another candidate is not automatically shared or updated.
- Outcome selection does not automatically write a call log.
- Outcome selection does not automatically change candidate general status.
- Quick call does not automatically change phone outcome.

## 3. Technical Behavior Implemented

- `phone_status` was not reused.
- `call_outcome` was added as a separate phone-level field.
- `call_outcome_updated_at` was added as a separate timestamp field.
- `studentPhoneOutcome` service updates only the selected phone record.
- `is_wrong` / `is_valid` behavior remains separate.
- Backup/restore preserves `call_outcome` and `call_outcome_updated_at`.
- Export/import mapping was intentionally not changed in this MVP.

## 4. UI Behavior Implemented

Final phone card structure:

- HEADER: Telefon slot label + relation badge
- BODY: phone number + horizontal existing action / check button + x
- FOOTER: Son sonuç + outcome chip

Example shape:

```text
TELEFON 1   Baba telefonu
0533 361 39 96              [✓] [x]
Son sonuç: Yok              [Aranmadı ▾]
```

UI behavior:

- Full-width select was removed.
- Outcome is shown as a compact chip/menu.
- Chip is in footer right, not header.
- Son sonuç remains footer left and read-only / call-log-derived.
- Relation badge remains in header next to phone slot label.
- ✓ / x remain horizontal in body row.
- `updated_at` is kept in data but not shown as a large always-visible row.
- Outcome menu opens by explicit click.
- No one-click cycle behavior exists.

## 5. Popover / Menu Positioning Fix

- Menu uses portal/fixed positioning.
- Menu is rendered above nearby cards and panels.
- Top/bottom placement is selected based on viewport space.
- If space is constrained, `max-height` and internal `overflow-y` are used.
- Anchor gap was fixed so the menu remains visually attached to the chip.
- Menu should not be hidden under Veli Bilgileri or neighboring cards.

## 6. Test and QA Results

Phone outcome implementation:

- Focused tests PASS.
- Import/export/settings regression PASS.
- OOM-safe full non-e2e suite PASS.
- Build PASS.

Compact UI polish:

- `StudentsPagePhoneSelection` PASS.
- `StudentsPageMultiPhone` PASS.
- Outcome/read-model related tests PASS.
- `backupRestore` PASS.
- Full non-e2e suite PASS.
- Build PASS.

Final known full result:

- Full non-e2e: 46 files / 342 tests PASS.
- Build PASS with known Vite chunk-size warning.

Manual QA PASS:

- UI encoding PASS.
- 7 Turkish options visible correctly.
- Phone 3 label preservation PASS.
- Anne/Baba relation badge preservation PASS.
- Manual Aranmadı reset PASS.
- Son sonuç vs Telefon durumu separation PASS.
- Compact 3-row card layout PASS.
- Outcome menu portal/fixed visibility PASS.
- Anchor gap visual fix PASS.

## 7. Out of Scope / Not Implemented

- No export/import outcome mapping in this MVP.
- No call log auto-mapping from outcome chip.
- No automatic outcome change after quick call.
- No history/audit screen for outcome changes.
- No shared outcome across duplicate same-number candidates.
- No backend/server persistence change.
- No VDS deploy implemented in this checkpoint.

## 8. VDS /demo Pilot Direction

- Pilot plan changed from local review package to Windows VDS + domain demo.
- Deployment target should be `/demo`, not domain root.
- Example target URL: `https://domain.com/demo/`.
- Vite/base path must be checked for `/demo` hosting.
- The app can still import Excel from the user's local computer through the browser file picker.
- If the app uses IndexedDB/local browser storage, data imported by the patron will live in the patron's browser.
- Patron pilot Excel should use import headers that exactly match the app's import mapping.

This checkpoint does not implement deployment.

## 9. Near-Term UX / Backlog Notes

### A. Phone selection soft validation

Problem:
Ulaşılamadı / Sonra Aranacak / reminder-like flows can unnecessarily block progress when no phone is selected.

Desired:
First click warns that no phone is selected. Second confirmation allows saving/continuing without tying the action to a specific phone.

### B. Phone number click-to-copy

Problem:
Copy buttons are confirmed working, but clicking directly on the phone number should also copy the number.

Desired:
Clicking any phone number copies it on first click and reuses the same copy feedback behavior.

### C. Student list scroll and selection memory

Problem:
When the user scrolls in the student list, navigates to reports/another area, then returns, the list starts from the top.

Desired:
Remember scroll position and last selected student so calling can continue from the same place.

### D. Wrong Number report counter

Problem:
Report screen shows Yanlış Numara count as 0 even after x button and/or dropdown wrong-number selections.

Desired:
Investigate whether report counts call logs, phone issue flags, call_outcome, candidate general status, or a combination. Avoid double counting.

### E. Description delete guard bug

Problem:
Deleting/clearing a description can show "Bu kayıt bağlı hatırlatma/randevu içerdiği için bu aşamada silinemez."

Desired:
Appointment/reminder dependency guard should block actual student/record deletion, not simple description clearing.

### F. Clear follow-up date when Aranmayacak is selected

Problem:
If Görüşme Durumu is set to Aranmayacak, previous follow-up date/time may remain.

Desired:
Automatically clear repeat-call/follow-up date/time when Aranmayacak is selected.

### G. Reminder lifecycle

Problem:
Overdue reminders stay overdue even after a follow-up has happened.

Desired:
Add reminder lifecycle actions: Tamamlandı, Ertele/Yeniden Planla, İptal. Terminal statuses like Aranmayacak, İlgilenmiyor, Kayıt Oldu can auto-close open reminders. Görüşüldü should ask whether to complete, reschedule, or keep reminder.

### H. Phone card semantic clarity

Problem:
Outcome chip values like Görüşüldü / Yanlış Numara / Kullanılmıyor can feel semantically close to ✓ / x actions.

Preferred future direction:

- Outcome chip = phone-level call result.
- Existing ✓ action = return/last-contacted/reference phone number.
- x action = number issue such as wrong number or not in use.

### I. General status rule for all invalid/unusable numbers

Decision note:
If all phone numbers are wrong/unusable, general Görüşme Durumu can use Yanlış Numara. No extra general status like Kullanılmıyor is needed for now.

## 10. Next Action After Docs Closure

Next after docs closure:

1. Commit/push docs-only closure.
2. Prepare `/demo` deployment plan for Windows VDS + domain.
3. Verify Vite base path for `/demo`.
4. Create pilot Excel matching import mapping exactly.
5. Deploy current safe branch to `/demo`.
6. Run pilot smoke on deployed URL.

## 11. Notes

- No source, test, package, import/export, backup, schema, or deployment file changed by this docs-only checkpoint.
- `dev-server.log` remains a local runtime file and must not be staged, committed, deleted, or treated as product documentation.
