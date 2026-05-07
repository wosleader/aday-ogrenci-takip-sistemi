export const DEFAULT_SHORTCUTS = [
  { action_key: "next_candidate", label: "Sıradaki adaya geç", shortcut: "N", is_active: true },
  { action_key: "call_not_reached", label: "Ulaşılamadı", shortcut: "1", is_active: true },
  { action_key: "call_reached", label: "Görüşüldü", shortcut: "2", is_active: true },
  { action_key: "call_later", label: "Sonra aranacak", shortcut: "4", is_active: true },
  { action_key: "create_appointment", label: "Randevu ver", shortcut: "5", is_active: true },
  { action_key: "do_not_call", label: "Aranmayacak", shortcut: "6", is_active: true },
  { action_key: "wrong_number", label: "Yanlış numara", shortcut: "7", is_active: true },
  { action_key: "registered", label: "Kayıt oldu", shortcut: "8", is_active: true },
  { action_key: "focus_note", label: "Açıklama alanına git", shortcut: "A", is_active: true },
  { action_key: "pick_reminder_date", label: "Tekrar arama tarihi seç", shortcut: "T", is_active: true },
  { action_key: "open_appointment", label: "Randevu ekranını aç", shortcut: "R", is_active: true },
  { action_key: "search", label: "Ara", shortcut: "F", is_active: true },
  { action_key: "pick_campaign", label: "Kampanya seç", shortcut: "K", is_active: true },
  { action_key: "edit", label: "Düzenle", shortcut: "D", is_active: true },
  { action_key: "save", label: "Kaydet", shortcut: "Ctrl+S", is_active: true },
  { action_key: "cancel", label: "İptal", shortcut: "Esc", is_active: true },
  { action_key: "confirm", label: "Onayla", shortcut: "Enter", is_active: true }
] as const;
