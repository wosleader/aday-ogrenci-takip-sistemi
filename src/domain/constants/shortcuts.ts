export const DEFAULT_SHORTCUTS = [
  { action_key: "previous_candidate", label: "Önceki adaya geç", shortcut: "ArrowUp", is_active: true },
  { action_key: "next_candidate", label: "Sonraki aday", shortcut: "N", is_active: true },
  { action_key: "focus_search", label: "Arama kutusuna git", shortcut: "F", is_active: true },
  { action_key: "save_call", label: "Kaydet ve sonrakine geç", shortcut: "Ctrl+S", is_active: true },
  { action_key: "call_reached", label: "Görüşüldü", shortcut: "1", is_active: true },
  { action_key: "call_not_reached", label: "Ulaşılamadı", shortcut: "2", is_active: true },
  { action_key: "call_wrong_number", label: "Yanlış numara", shortcut: "4", is_active: true },
  { action_key: "call_appointment", label: "Randevu", shortcut: "5", is_active: true },
  { action_key: "call_do_not_call", label: "Aranmayacak", shortcut: "6", is_active: true },
  { action_key: "mark_phone_1_contacted", label: "Telefon 1'i görüşülen numara yap", shortcut: "T", is_active: true },
  { action_key: "mark_phone_2_contacted", label: "Telefon 2'yi görüşülen numara yap", shortcut: "Y", is_active: true },
  { action_key: "toggle_active_phone_invalid", label: "Yanlış numara / kullanılmıyor", shortcut: "X", is_active: true },
  { action_key: "escape", label: "Kapat / vazgeç", shortcut: "Escape", is_active: true }
] as const;
