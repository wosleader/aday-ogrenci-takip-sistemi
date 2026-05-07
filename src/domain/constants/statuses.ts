export const LIFE_CYCLE_STATUSES = {
  candidate: "Aday",
  do_not_call: "Aranmayacak",
  registered: "Kayıt Oldu",
  archived: "Arşivlendi"
} as const;

export type LifecycleStatus = keyof typeof LIFE_CYCLE_STATUSES;

export const CALL_RESULTS = {
  not_called: "Aranmadı",
  not_reached: "Ulaşılamadı",
  reached: "Görüşüldü",
  call_later: "Sonra Aranacak",
  appointment: "Randevu Verildi",
  do_not_call: "Aranmayacak",
  wrong_number: "Yanlış Numara",
  registered: "Kayıt Oldu",
  not_interested: "İlgilenmiyor"
} as const;

export type CallResult = keyof typeof CALL_RESULTS;

export const REMINDER_STATUSES = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
  cancelled: "İptal"
} as const;

export type ReminderStatus = keyof typeof REMINDER_STATUSES;

export const REMINDER_TYPES = {
  call: "Tekrar Arama",
  follow_up: "Takip"
} as const;

export type ReminderType = keyof typeof REMINDER_TYPES;

export const APPOINTMENT_STATUSES = {
  pending: "Bekliyor",
  attended: "Geldi",
  missed: "Gelmedi",
  postponed: "Ertelendi",
  cancelled: "İptal",
  registered: "Kayıt Oldu"
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUSES;

export const AUDIT_ACTION_TYPES = {
  create: "Oluşturma",
  update: "Güncelleme",
  delete: "Silme",
  import: "Import",
  backup: "Yedek"
} as const;

export type AuditActionType = keyof typeof AUDIT_ACTION_TYPES;

export const CATEGORIES = {
  YKS: "YKS",
  LGS: "LGS",
  Diger: "Diğer"
} as const;

export type StudentCategory = keyof typeof CATEGORIES;
