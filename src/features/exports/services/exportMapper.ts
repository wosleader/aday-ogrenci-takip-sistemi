import type { CallResult, LifecycleStatus } from "../../../domain/constants/statuses";
import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type {
  DetailedExportSheet,
  ExportDataset,
  ExportPreviewSummary,
  ExportScope,
  ExportStudentBundle,
  SummaryConversationReportSheet
} from "./exportTypes";

export const BASE_EXPORT_HEADERS = [
  "Sıra No",
  "Öğrenci Ad Soyad",
  "Veli Ad Soyad",
  "Telefon 1",
  "Telefon 1 Durumu",
  "Telefon 2",
  "Telefon 2 Durumu",
  "Sınıf",
  "Öğrenci Grubu",
  "Kategori",
  "Kampanya",
  "Genel Açıklama",
  "Son Arama Sonucu",
  "Son Görüşülen Telefon",
  "Son Görüşme Tarihi",
  "Tekrar Aranacak mı?",
  "Tekrar Arama Tarihi",
  "Tekrar Arama Saati",
  "Randevu Durumu",
  "Randevu Tarihi",
  "Kayıt Durumu",
  "Mükerrer Telefon Uyarısı",
  "Kaynak Excel Satırı",
  "Oluşturulma Tarihi",
  "Güncellenme Tarihi"
] as const;

export const SUMMARY_EXPORT_BASE_HEADERS = [
  "Sıra No",
  "Öğrenci Ad Soyad",
  "Veli Ad Soyad",
  "Telefon 1",
  "Telefon 1 Durumu",
  "Telefon 2",
  "Telefon 2 Durumu",
  "Sınıf",
  "Genel Açıklama"
] as const;

export const SUMMARY_EXPORT_TRAILING_HEADERS = [
  "Son Arama Sonucu",
  "Son Görüşme Tarihi",
  "Son Güncellenme Tarihi"
] as const;

const CALL_RESULT_LABELS: Record<string, string> = {
  not_called: "Aranmadı",
  not_reached: "Ulaşılamadı",
  reached: "Görüşüldü",
  thinking: "Düşünüyor",
  call_later: "Tekrar aranacak",
  appointment: "Randevu",
  do_not_call: "Aranmayacak",
  wrong_number: "Yanlış numara",
  registered: "Kayıt oldu",
  not_interested: "İlgilenmiyor"
};

const LIFECYCLE_LABELS: Record<string, string> = {
  candidate: "Aday",
  do_not_call: "Aranmayacak",
  registered: "Kayıt oldu",
  archived: "Arşivlendi"
};

const APPOINTMENT_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  attended: "Geldi",
  missed: "Gelmedi",
  postponed: "Ertelendi",
  cancelled: "İptal",
  registered: "Kayıt oldu"
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatExportDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatExportTime(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatExportDateTime(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${formatExportDate(value)} ${formatExportTime(value)}`;
}

export function getCallResultLabel(value?: CallResult | string | null): string {
  return value ? CALL_RESULT_LABELS[value] ?? "Aranmadı" : "Aranmadı";
}

export function getLifecycleLabel(value?: LifecycleStatus | string | null): string {
  return value ? LIFECYCLE_LABELS[value] ?? "Aday" : "Aday";
}

export function getPhoneStatusLabel(phone?: PhoneRecord | null): string {
  if (!phone) {
    return "Belirtilmedi";
  }

  if (phone.is_wrong || phone.phone_status === "invalid") {
    return "Yanlış numara / kullanılmıyor";
  }

  if (phone.phone_status === "contacted") {
    return "Son görüşülen / iletişim kurulan numara";
  }

  if (phone.phone_status === "active") {
    return "Aktif";
  }

  return "Belirtilmedi";
}

export function getSummaryPhoneStatusLabel(phone?: PhoneRecord | null): string {
  if (!phone) {
    return "Belirtilmedi";
  }

  if (phone.is_wrong || phone.phone_status === "invalid") {
    return "Yanlış numara / kullanılmıyor";
  }

  if (phone.phone_status === "contacted") {
    return "Son görüşülen numara";
  }

  if (phone.phone_status === "active") {
    return "Aktif";
  }

  return "Belirtilmedi";
}

export function getSummaryCallResultLabel(value?: CallResult | string | null): string {
  if (value === "do_not_call" || value === "not_interested") {
    return "Aranmayacak / ilgilenmiyor";
  }

  return getCallResultLabel(value);
}

function getAppointmentStatusLabel(appointment?: AppointmentRecord | null): string {
  return appointment?.status ? APPOINTMENT_LABELS[appointment.status] ?? appointment.status : "";
}

function getReminderDate(reminder?: ReminderRecord | null): string {
  return formatExportDate(reminder?.reminder_at);
}

function getReminderTime(reminder?: ReminderRecord | null): string {
  return formatExportTime(reminder?.reminder_at);
}

function getLastCallLog(bundle: ExportStudentBundle): (CallLogRecord & { id: number }) | null {
  return bundle.call_logs[bundle.call_logs.length - 1] ?? null;
}

function getChronologicalCallLogs(bundle: ExportStudentBundle): Array<CallLogRecord & { id: number }> {
  return [...bundle.call_logs].sort(
    (left, right) => left.call_time.localeCompare(right.call_time) || (left.id ?? 0) - (right.id ?? 0)
  );
}

function getFilledNoteCallLogs(bundle: ExportStudentBundle): Array<CallLogRecord & { id: number }> {
  return getChronologicalCallLogs(bundle).filter((callLog) => callLog.note?.trim());
}

function createDynamicCallHeaders(maxCallLogCount: number): string[] {
  return Array.from({ length: maxCallLogCount }).flatMap((_, index) => {
    const callNumber = index + 1;

    return [
      `Arama ${callNumber} Tarihi`,
      `Arama ${callNumber} Sonucu`,
      `Arama ${callNumber} Telefon`,
      `Arama ${callNumber} Açıklaması`,
      `Arama ${callNumber} Tekrar Arama Tarihi`
    ];
  });
}

function createBaseRow(bundle: ExportStudentBundle, index: number): Array<string | number> {
  const lastCallLog = getLastCallLog(bundle);
  const pendingReminder = bundle.pending_reminder;

  return [
    index + 1,
    bundle.student.student_full_name,
    bundle.guardian?.guardian_full_name ?? "",
    bundle.phone_1?.phone_number ?? "",
    getPhoneStatusLabel(bundle.phone_1),
    bundle.phone_2?.phone_number ?? "",
    getPhoneStatusLabel(bundle.phone_2),
    bundle.student.current_class ?? "",
    bundle.student.student_group,
    bundle.student.category,
    bundle.campaign?.name ?? "Diğer",
    bundle.student.general_note ?? "",
    getCallResultLabel(bundle.student.last_call_result),
    lastCallLog?.contacted_phone_number ?? "",
    formatExportDateTime(bundle.student.last_contacted_at ?? lastCallLog?.call_time),
    pendingReminder ? "Evet" : "Hayır",
    getReminderDate(pendingReminder),
    getReminderTime(pendingReminder),
    getAppointmentStatusLabel(bundle.appointment),
    formatExportDateTime(bundle.appointment?.appointment_at),
    getLifecycleLabel(bundle.student.lifecycle_status),
    bundle.duplicate_phone_keys.length > 0 ? "Var - aynı telefon farklı adaylarda geçiyor" : "Yok",
    bundle.student.source_row_number ?? "",
    formatExportDateTime(bundle.student.created_at),
    formatExportDateTime(bundle.student.updated_at)
  ];
}

function createDynamicCallCells(bundle: ExportStudentBundle, maxCallLogCount: number): Array<string | number> {
  return Array.from({ length: maxCallLogCount }).flatMap((_, index) => {
    const callLog = bundle.call_logs[index];

    if (!callLog) {
      return ["", "", "", "", ""];
    }

    return [
      formatExportDateTime(callLog.call_time),
      getCallResultLabel(callLog.call_result),
      callLog.contacted_phone_number ?? "",
      callLog.note ?? "",
      formatExportDateTime(callLog.reminder_at)
    ];
  });
}

function createSummaryNoteHeaders(maxNoteCount: number): string[] {
  return Array.from({ length: maxNoteCount }).flatMap((_, index) => {
    const noteNumber = index + 1;

    return [`Açıklama ${noteNumber}`, `Açıklama ${noteNumber} Tarihi`];
  });
}

function createSummaryBaseRow(bundle: ExportStudentBundle, index: number): Array<string | number> {
  return [
    index + 1,
    bundle.student.student_full_name,
    bundle.guardian?.guardian_full_name ?? "",
    bundle.phone_1?.phone_number ?? "",
    getSummaryPhoneStatusLabel(bundle.phone_1),
    bundle.phone_2?.phone_number ?? "",
    getSummaryPhoneStatusLabel(bundle.phone_2),
    bundle.student.current_class ?? "",
    bundle.student.general_note ?? ""
  ];
}

function createSummaryNoteCells(bundle: ExportStudentBundle, maxNoteCount: number): Array<string | number> {
  const noteCallLogs = getFilledNoteCallLogs(bundle);

  return Array.from({ length: maxNoteCount }).flatMap((_, index) => {
    const callLog = noteCallLogs[index];

    if (!callLog) {
      return ["", ""];
    }

    return [callLog.note?.trim() ?? "", formatExportDateTime(callLog.call_time)];
  });
}

function createSummaryTrailingCells(bundle: ExportStudentBundle): Array<string | number> {
  const chronologicalCallLogs = getChronologicalCallLogs(bundle);
  const lastCallLog = chronologicalCallLogs[chronologicalCallLogs.length - 1] ?? null;
  const lastUpdatedAt = bundle.student.updated_at || lastCallLog?.call_time || bundle.student.created_at;

  return [
    getSummaryCallResultLabel(lastCallLog?.call_result ?? bundle.student.last_call_result),
    formatExportDateTime(lastCallLog?.call_time),
    formatExportDateTime(lastUpdatedAt)
  ];
}

export function createDetailedExportSheet(dataset: ExportDataset): DetailedExportSheet {
  const maxCallLogCount = Math.max(0, ...dataset.bundles.map((bundle) => bundle.call_logs.length));
  const headers = [...BASE_EXPORT_HEADERS, ...createDynamicCallHeaders(maxCallLogCount)];
  const rows = dataset.bundles.map((bundle, index) => [
    ...createBaseRow(bundle, index),
    ...createDynamicCallCells(bundle, maxCallLogCount)
  ]);
  const totalCallLogCount = dataset.bundles.reduce((total, bundle) => total + bundle.call_logs.length, 0);

  return {
    headers,
    rows,
    max_call_log_count: maxCallLogCount,
    total_call_log_count: totalCallLogCount,
    estimated_column_count: headers.length
  };
}

export function createSummaryConversationReportSheet(dataset: ExportDataset): SummaryConversationReportSheet {
  const maxNoteCount = Math.max(0, ...dataset.bundles.map((bundle) => getFilledNoteCallLogs(bundle).length));
  const headers = [
    ...SUMMARY_EXPORT_BASE_HEADERS,
    ...createSummaryNoteHeaders(maxNoteCount),
    ...SUMMARY_EXPORT_TRAILING_HEADERS
  ];
  const rows = dataset.bundles.map((bundle, index) => [
    ...createSummaryBaseRow(bundle, index),
    ...createSummaryNoteCells(bundle, maxNoteCount),
    ...createSummaryTrailingCells(bundle)
  ]);
  const totalCallLogCount = dataset.bundles.reduce((total, bundle) => total + bundle.call_logs.length, 0);

  return {
    headers,
    rows,
    max_note_count: maxNoteCount,
    total_call_log_count: totalCallLogCount,
    estimated_column_count: headers.length
  };
}

export function createExportPreviewSummary(dataset: ExportDataset, scope: ExportScope): ExportPreviewSummary {
  const sheet = createDetailedExportSheet(dataset);

  return {
    scope,
    student_count: dataset.bundles.length,
    total_call_log_count: sheet.total_call_log_count,
    max_call_log_count: sheet.max_call_log_count,
    dynamic_call_group_count: sheet.max_call_log_count,
    estimated_column_count: sheet.estimated_column_count
  };
}

export function createSummaryExportPreviewSummary(dataset: ExportDataset, scope: ExportScope): ExportPreviewSummary {
  const sheet = createSummaryConversationReportSheet(dataset);

  return {
    scope,
    student_count: dataset.bundles.length,
    total_call_log_count: sheet.total_call_log_count,
    max_call_log_count: sheet.max_note_count,
    dynamic_call_group_count: sheet.max_note_count,
    estimated_column_count: sheet.estimated_column_count
  };
}
