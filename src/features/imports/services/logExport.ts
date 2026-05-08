import { APP_VERSION } from "../../../domain/constants/settings";
import { COLUMN_DEFINITIONS } from "./columnDefinitions";
import type { ColumnMatch, ImportEngineLog, ImportLogSeverity, ImportSimulationSummary, ParsedWorksheet } from "./types";

export type PrivacyMode = "full" | "private";

type SupportLogInput = {
  worksheet: ParsedWorksheet;
  summary: ImportSimulationSummary;
  columnMatches: ColumnMatch[];
  activePage: string;
  privacyMode: PrivacyMode;
};

const SEVERITY_LABELS: Record<ImportLogSeverity, string> = {
  error: "Hata",
  warning: "Uyarı",
  info: "Bilgi"
};

export function maskPhone(value: string): string {
  return value.replace(/\b(0?5\d{2})(\d{4})(\d{3})\b/g, "$1****$3");
}

export function maskPersonName(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => {
      if (!part) {
        return part;
      }

      return `${part[0]}${"*".repeat(Math.max(part.length - 1, 3))}`;
    })
    .join(" ");
}

function maskKnownPeople(value: string, summary: ImportSimulationSummary): string {
  let maskedValue = value;

  for (const row of summary.preview_rows) {
    if (row.student_full_name) {
      maskedValue = maskedValue.replaceAll(row.student_full_name, maskPersonName(row.student_full_name));
    }

    if (row.guardian_full_name) {
      maskedValue = maskedValue.replaceAll(row.guardian_full_name, maskPersonName(row.guardian_full_name));
    }
  }

  for (const warning of summary.duplicate_phone_warnings) {
    for (const studentName of warning.student_names) {
      maskedValue = maskedValue.replaceAll(studentName, maskPersonName(studentName));
    }
  }

  return maskedValue;
}

function applyPrivacy(value: string, summary: ImportSimulationSummary, privacyMode: PrivacyMode): string {
  if (privacyMode === "full") {
    return value;
  }

  return maskKnownPeople(maskPhone(value), summary).replace(/Açıklama:.*$/gim, "Açıklama: gizlendi");
}

export function getAllImportLogs(summary: ImportSimulationSummary): ImportEngineLog[] {
  return [...summary.logs, ...summary.detailed_logs];
}

export function groupLogsBySeverity(logs: ImportEngineLog[]) {
  return {
    error: logs.filter((log) => log.severity === "error"),
    warning: logs.filter((log) => log.severity === "warning"),
    info: logs.filter((log) => log.severity === "info")
  };
}

function crmFieldLabel(field?: string): string {
  if (!field) {
    return "-";
  }

  return COLUMN_DEFINITIONS.find((definition) => definition.field === field)?.label ?? field;
}

function logToLine(log: ImportEngineLog, summary: ImportSimulationSummary, privacyMode: PrivacyMode): string {
  const rawLine = [
    `Seviye: ${SEVERITY_LABELS[log.severity]}`,
    `Satır: ${log.row_number ?? "-"}`,
    `Kolon: ${log.column_letter ?? log.column_name ?? "-"}`,
    `Alan: ${log.field_name ?? "-"}`,
    `Mesaj: ${log.message}`,
    `Önerilen işlem: ${log.suggested_action ?? "-"}`,
    `Otomatik düzeltildi mi: ${log.auto_fixed ? "Evet" : "Hayır"}`
  ].join(" | ");

  return applyPrivacy(rawLine, summary, privacyMode);
}

function summaryLines(summary: ImportSimulationSummary): string[] {
  return [
    `Toplam satır: ${summary.total_rows}`,
    `Okunacak satır: ${summary.readable_rows}`,
    `İçe aktarılmayacak satır: ${summary.skipped_rows}`,
    `Telefon bilgisi eksik kayıt: ${summary.empty_phone_count}`,
    `Telefon 1 boş, alternatif telefon var: ${summary.phone1_empty_with_alternative_count}`,
    `Telefon 1 ve Telefon 2 boş: ${summary.both_phones_empty_count}`,
    `Kampanyası Diğer yapılacak: ${summary.default_campaign_assigned_count}`,
    `Varsayılan saat atanacak: ${summary.default_time_assigned_count}`
  ];
}

function columnMatchLines(columnMatches: ColumnMatch[]): string[] {
  return columnMatches.map((match) =>
    [
      `${match.source_column_letter} (${match.source_column_number})`,
      `Başlık: ${match.source_header || "Başlık boş"}`,
      `CRM alanı: ${crmFieldLabel(match.target_field)}`,
      `Durum: ${match.status}`,
      `Güven: ${Math.round(match.confidence * 100)}%`
    ].join(" | ")
  );
}

export function createImportLogText(
  worksheet: ParsedWorksheet,
  summary: ImportSimulationSummary,
  columnMatches: ColumnMatch[],
  privacyMode: PrivacyMode = "full"
): string {
  const logs = getAllImportLogs(summary);
  const lines = [
    "Aday Öğrenci Takip Sistemi - Import Ön Kontrol Logu",
    `Dosya adı: ${worksheet.file_name}`,
    `Okunan worksheet: ${worksheet.sheet_name}`,
    `Algılanan başlık satırı: ${worksheet.detected_header_row_number}`,
    "",
    "Simülasyon Özeti",
    ...summaryLines(summary),
    "",
    "Kolon Eşleştirme Özeti",
    ...columnMatchLines(columnMatches),
    "",
    "Import Log Mesajları",
    ...logs.map((log) => logToLine(log, summary, privacyMode))
  ];

  return lines.join("\n");
}

export function createTechnicalSupportLog(input: SupportLogInput): string {
  const { worksheet, summary, columnMatches, activePage, privacyMode } = input;
  const lines = [
    "Aday Öğrenci Takip Sistemi - Teknik Destek Logu",
    `Uygulama adı: Aday Öğrenci Takip Sistemi`,
    `Uygulama sürümü: ${APP_VERSION}`,
    `Log oluşturma zamanı: ${new Date().toISOString()}`,
    `Aktif sayfa: ${activePage}`,
    `Seçilen dosya adı: ${worksheet.file_name}`,
    `Okunan worksheet adı: ${worksheet.sheet_name}`,
    `Algılanan başlık satırı: ${worksheet.detected_header_row_number}`,
    `Tarayıcı bilgisi: ${typeof navigator === "undefined" ? "Bilinmiyor" : navigator.userAgent}`,
    `Online/offline durumu: ${typeof navigator === "undefined" ? "Bilinmiyor" : navigator.onLine ? "Online" : "Offline"}`,
    "",
    "Import Simülasyon Özeti",
    ...summaryLines(summary),
    "",
    "Kolon Eşleştirme Özeti",
    ...columnMatchLines(columnMatches),
    "",
    "Import Logları",
    ...getAllImportLogs(summary).map((log) => logToLine(log, summary, privacyMode))
  ];

  return applyPrivacy(lines.join("\n"), summary, privacyMode);
}

export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
