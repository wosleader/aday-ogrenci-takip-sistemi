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
  "Anne Adı",
  "Baba Adı",
  "Telefon 1",
  "Telefon 1 Durumu",
  "Telefon 2",
  "Telefon 2 Durumu",
  "Telefon 3",
  "Telefon 3 Durumu",
  "Telefon 4",
  "Telefon 4 Durumu",
  "Telefon 5",
  "Telefon 5 Durumu",
  "Telefon 6",
  "Telefon 6 Durumu",
  "Telefon 7",
  "Telefon 7 Durumu",
  "Telefon 8",
  "Telefon 8 Durumu",
  "Telefon 9",
  "Telefon 9 Durumu",
  "Telefon 10",
  "Telefon 10 Durumu",
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
  completed: "Geldi",
  no_show: "Gelmedi",
  attended: "Geldi",
  missed: "Gelmedi",
  postponed: "Ertelendi",
  cancelled: "İptal",
  registered: "Kayıt oldu"
};

const PHONE_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type SummaryColumnPlan = {
  includeMother: boolean;
  includeFather: boolean;
  includeNeighborhood: boolean;
  includeDistrict: boolean;
  maxPhoneSlot: number;
};

export type SummaryCanonicalRow = {
  sequence: number;
  studentName: string;
  guardianName: string;
  motherName: string;
  fatherName: string;
  neighborhood: string;
  district: string;
  phoneSlots: ReadonlyMap<number, PhoneRecord>;
  currentClass: string;
  generalNote: string;
  notes: Array<{ note: string; callTime: string }>;
  lastCallResult: string;
  lastCallTime: string;
  lastUpdatedAt: string;
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

  if (phone.is_valid === false) {
    return "Geçersiz format";
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
    return "";
  }

  if (phone.is_valid === false) {
    return "Geçersiz format";
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

function getExplicitPhoneSlot(phone: PhoneRecord): number | null {
  const labels = [phone.reference_label, phone.phone_label].filter(Boolean) as string[];

  for (const label of labels) {
    const directMatch = label.match(/\b(?:telefon|phone|tel|gsm)\s*(10|[1-9])\b/i);
    const reverseMatch = label.match(/\b(10|[1-9])\s*\.?\s*(?:telefon|phone|tel|gsm)\b/i);
    const slot = Number(directMatch?.[1] ?? reverseMatch?.[1]);

    if (slot >= 1 && slot <= 10) {
      return slot;
    }
  }

  return null;
}

function getPhoneSlot(phone: PhoneRecord): number | null {
  const explicitSlot = getExplicitPhoneSlot(phone);

  if (explicitSlot) {
    return explicitSlot;
  }

  const priority = phone.priority;

  return typeof priority === "number" && priority >= 1 && priority <= 10 && Number.isInteger(priority) ? priority : null;
}

function createPhoneSlotMap(bundle: ExportStudentBundle): Map<number, PhoneRecord> {
  const phoneSlots = new Map<number, PhoneRecord>();
  const seenNormalizedPhones = new Set<string>();
  const sourcePhones =
    bundle.phones && bundle.phones.length > 0 ? bundle.phones : ([bundle.phone_1, bundle.phone_2].filter(Boolean) as PhoneRecord[]);

  for (const phone of sourcePhones) {
    if (!phone) {
      continue;
    }

    const normalizedPhone = phone.normalized_phone_number?.trim();

    if (normalizedPhone && seenNormalizedPhones.has(normalizedPhone)) {
      continue;
    }

    const slot = getPhoneSlot(phone);

    if (!slot || phoneSlots.has(slot)) {
      continue;
    }

    phoneSlots.set(slot, phone);

    if (normalizedPhone) {
      seenNormalizedPhones.add(normalizedPhone);
    }
  }

  return phoneSlots;
}

function createDetailedPhoneCells(bundle: ExportStudentBundle): Array<string | number> {
  const phoneSlots = createPhoneSlotMap(bundle);

  return PHONE_SLOTS.flatMap((slot) => {
    const phone = phoneSlots.get(slot);

    return [phone?.phone_number ?? "", phone ? getPhoneStatusLabel(phone) : ""];
  });
}

function createBaseRow(bundle: ExportStudentBundle, index: number): Array<string | number> {
  const lastCallLog = getLastCallLog(bundle);
  const pendingReminder = bundle.pending_reminder;

  return [
    index + 1,
    bundle.student.student_full_name,
    bundle.guardian?.guardian_full_name ?? "",
    bundle.mother?.guardian_full_name ?? "",
    bundle.father?.guardian_full_name ?? "",
    ...createDetailedPhoneCells(bundle),
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

function createSummaryNoteCells(row: SummaryCanonicalRow, maxNoteCount: number): Array<string | number> {
  return Array.from({ length: maxNoteCount }).flatMap((_, index) => {
    const note = row.notes[index];

    if (!note) {
      return ["", ""];
    }

    return [note.note, formatExportDateTime(note.callTime)];
  });
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function createSummaryCanonicalRows(dataset: ExportDataset): SummaryCanonicalRow[] {
  return dataset.bundles.map((bundle, index) => {
    const chronologicalCallLogs = getChronologicalCallLogs(bundle);
    const lastCallLog = chronologicalCallLogs[chronologicalCallLogs.length - 1] ?? null;
    const lastUpdatedAt = bundle.student.updated_at || lastCallLog?.call_time || bundle.student.created_at;

    return {
      sequence: index + 1,
      studentName: bundle.student.student_full_name,
      guardianName: bundle.guardian?.guardian_full_name ?? "",
      motherName: bundle.mother?.guardian_full_name ?? "",
      fatherName: bundle.father?.guardian_full_name ?? "",
      neighborhood: bundle.student.neighborhood ?? "",
      district: bundle.student.district ?? "",
      phoneSlots: createPhoneSlotMap(bundle),
      currentClass: bundle.student.current_class ?? "",
      generalNote: bundle.student.general_note ?? "",
      notes: chronologicalCallLogs.flatMap((callLog) => {
        const note = callLog.note?.trim();

        return note ? [{ note, callTime: callLog.call_time }] : [];
      }),
      lastCallResult: getSummaryCallResultLabel(lastCallLog?.call_result ?? bundle.student.last_call_result),
      lastCallTime: formatExportDateTime(lastCallLog?.call_time),
      lastUpdatedAt: formatExportDateTime(lastUpdatedAt)
    };
  });
}

export function createSummaryColumnPlan(rows: SummaryCanonicalRow[]): SummaryColumnPlan {
  const highestPhoneSlot = Math.max(2, ...rows.flatMap((row) => [...row.phoneSlots.keys()]));

  return {
    includeMother: rows.some((row) => hasText(row.motherName)),
    includeFather: rows.some((row) => hasText(row.fatherName)),
    includeNeighborhood: rows.some((row) => hasText(row.neighborhood)),
    includeDistrict: rows.some((row) => hasText(row.district)),
    maxPhoneSlot: Math.min(10, highestPhoneSlot)
  };
}

export function validateSummaryColumnPlan(rows: SummaryCanonicalRow[], plan: SummaryColumnPlan): void {
  if (!Number.isInteger(plan.maxPhoneSlot) || plan.maxPhoneSlot < 2 || plan.maxPhoneSlot > 10) {
    throw new Error(`Özet export telefon kolon planı 2-10 aralığında olmalı: ${plan.maxPhoneSlot}`);
  }

  const optionalFieldChecks = [
    { included: plan.includeMother, label: "Anne Adı", getValue: (row: SummaryCanonicalRow) => row.motherName },
    { included: plan.includeFather, label: "Baba Adı", getValue: (row: SummaryCanonicalRow) => row.fatherName },
    {
      included: plan.includeNeighborhood,
      label: "Mahalle",
      getValue: (row: SummaryCanonicalRow) => row.neighborhood
    },
    { included: plan.includeDistrict, label: "İlçe", getValue: (row: SummaryCanonicalRow) => row.district }
  ];

  for (const check of optionalFieldChecks) {
    if (!check.included && rows.some((row) => hasText(check.getValue(row)))) {
      throw new Error(`Özet export kolon planı dolu ${check.label} verisini dışarıda bırakıyor.`);
    }
  }

  for (const row of rows) {
    for (const slot of row.phoneSlots.keys()) {
      if (!Number.isInteger(slot) || slot < 1 || slot > 10) {
        throw new Error(`Özet export geçersiz telefon slotu içeriyor: ${slot}`);
      }

      if (slot > plan.maxPhoneSlot) {
        throw new Error(`Özet export kolon planı Telefon ${slot} verisini dışarıda bırakıyor.`);
      }
    }
  }
}

function createSummaryAdaptiveHeaders(plan: SummaryColumnPlan): string[] {
  const headers = ["Sıra No", "Öğrenci Ad Soyad", "Veli Ad Soyad"];

  if (plan.includeMother) {
    headers.push("Anne Adı");
  }

  if (plan.includeFather) {
    headers.push("Baba Adı");
  }

  if (plan.includeNeighborhood) {
    headers.push("Mahalle");
  }

  if (plan.includeDistrict) {
    headers.push("İlçe");
  }

  for (let slot = 1; slot <= plan.maxPhoneSlot; slot += 1) {
    headers.push(`Telefon ${slot}`, `Telefon ${slot} Durumu`);
  }

  headers.push("Sınıf", "Genel Açıklama");

  return headers;
}

function createSummaryAdaptiveCells(row: SummaryCanonicalRow, plan: SummaryColumnPlan): Array<string | number> {
  const cells: Array<string | number> = [row.sequence, row.studentName, row.guardianName];

  if (plan.includeMother) {
    cells.push(row.motherName);
  }

  if (plan.includeFather) {
    cells.push(row.fatherName);
  }

  if (plan.includeNeighborhood) {
    cells.push(row.neighborhood);
  }

  if (plan.includeDistrict) {
    cells.push(row.district);
  }

  for (let slot = 1; slot <= plan.maxPhoneSlot; slot += 1) {
    const phone = row.phoneSlots.get(slot);
    cells.push(phone?.phone_number ?? "", getSummaryPhoneStatusLabel(phone));
  }

  cells.push(row.currentClass, row.generalNote);

  return cells;
}

function validateSummarySheetShape(
  headers: string[],
  rows: Array<Array<string | number>>,
  plan: SummaryColumnPlan
): void {
  for (let slot = 1; slot <= plan.maxPhoneSlot; slot += 1) {
    const phoneHeader = `Telefon ${slot}`;
    const statusHeader = `Telefon ${slot} Durumu`;

    if (!headers.includes(phoneHeader) || !headers.includes(statusHeader)) {
      throw new Error(`Özet export ${phoneHeader} ve durum kolonunu birlikte içermeli.`);
    }
  }

  for (const header of headers) {
    const phoneMatch = header.match(/^Telefon (10|[1-9])$/);

    if (phoneMatch && !headers.includes(`${header} Durumu`)) {
      throw new Error(`Özet export ${header} için durum kolonu içermiyor.`);
    }
  }

  rows.forEach((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(
        `Özet export ${index + 1}. satır uzunluğu başlıklarla eşleşmiyor: ${row.length}/${headers.length}`
      );
    }
  });
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
  const canonicalRows = createSummaryCanonicalRows(dataset);
  const columnPlan = createSummaryColumnPlan(canonicalRows);
  validateSummaryColumnPlan(canonicalRows, columnPlan);
  const maxNoteCount = Math.max(0, ...canonicalRows.map((row) => row.notes.length));
  const headers = [
    ...createSummaryAdaptiveHeaders(columnPlan),
    ...createSummaryNoteHeaders(maxNoteCount),
    ...SUMMARY_EXPORT_TRAILING_HEADERS
  ];
  const rows = canonicalRows.map((row) => [
    ...createSummaryAdaptiveCells(row, columnPlan),
    ...createSummaryNoteCells(row, maxNoteCount),
    row.lastCallResult,
    row.lastCallTime,
    row.lastUpdatedAt
  ]);
  const totalCallLogCount = dataset.bundles.reduce((total, bundle) => total + bundle.call_logs.length, 0);
  validateSummarySheetShape(headers, rows, columnPlan);

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
