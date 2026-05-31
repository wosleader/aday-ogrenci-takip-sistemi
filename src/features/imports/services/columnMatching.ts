import { normalizeText } from "../../../utils/normalizeText";
import { COLUMN_DEFINITIONS } from "./columnDefinitions";
import { formatColumnRef, toExcelColumnLetter } from "./excelColumns";
import type { ColumnMatch, ImportEngineLog, ImportFieldKey } from "./types";

const FIRST_DUPLICATE_HEADER_TARGETS: Record<string, ImportFieldKey[]> = {
  sinif: ["current_class", "student_group"]
};

const SYSTEM_EXPORT_INFO_HEADERS = new Set([
  "sira no",
  "kategori",
  "son arama sonucu",
  "son gorusulen telefon",
  "son gorusme tarihi",
  "tekrar arama saati",
  "randevu durumu",
  "randevu tarihi",
  "kayit durumu",
  "mukerrer telefon uyarisi",
  "kaynak excel satiri",
  "olusturulma tarihi",
  "guncellenme tarihi"
]);

function isSystemExportInfoHeader(normalizedHeader: string): boolean {
  return (
    SYSTEM_EXPORT_INFO_HEADERS.has(normalizedHeader) ||
    /^telefon (10|[1-9]) durumu$/.test(normalizedHeader) ||
    /^arama \d+ (tarihi|sonucu|telefon|aciklamasi|tekrar arama tarihi)$/.test(normalizedHeader)
  );
}

export function normalizeColumnHeader(header: string): string {
  return normalizeText(header).replace(/\s+/g, " ").trim();
}

export function findDefinitionByNormalizedHeader(normalizedHeader: string) {
  return COLUMN_DEFINITIONS.find((definition) => definition.aliases.includes(normalizedHeader));
}

export function findMisspelledDefinitionByNormalizedHeader(normalizedHeader: string) {
  return COLUMN_DEFINITIONS.find((definition) =>
    definition.misspellings?.includes(normalizedHeader)
  );
}

export function scoreHeaderRow(row: unknown[]): number {
  const seenFields = new Set<ImportFieldKey>();
  let score = 0;

  for (const cell of row) {
    const normalizedHeader = normalizeColumnHeader(String(cell ?? ""));
    const definition =
      findDefinitionByNormalizedHeader(normalizedHeader) ??
      findMisspelledDefinitionByNormalizedHeader(normalizedHeader);

    if (definition && !seenFields.has(definition.field)) {
      seenFields.add(definition.field);
      score += definition.required ? 3 : 1;
    }
  }

  return score;
}

export function matchColumns(
  headers: string[],
  manualMappings: Record<number, ImportFieldKey | "ignore" | ""> = {}
): {
  matches: ColumnMatch[];
  logs: ImportEngineLog[];
} {
  const logs: ImportEngineLog[] = [];
  const duplicateHeaderCounts = new Map<string, number>();

  const matches = headers.map((sourceHeader, sourceIndex): ColumnMatch => {
    const normalizedHeader = normalizeColumnHeader(sourceHeader);
    const source_column_letter = toExcelColumnLetter(sourceIndex);
    const source_column_number = sourceIndex + 1;
    const manualTarget = manualMappings[sourceIndex];

    if (manualTarget === "ignore") {
      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        status: "ignored",
        confidence: 1,
        note: "Kullanıcı tarafından yok sayıldı."
      };
    }

    if (manualTarget) {
      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        target_field: manualTarget,
        status: "manual",
        confidence: 1,
        note: "Kullanıcı tarafından eşleştirildi."
      };
    }

    if (!normalizedHeader) {
      logs.push({
        column_name: sourceHeader,
        column_letter: source_column_letter,
        column_number: source_column_number,
        severity: "info",
        message: `Kolon ${source_column_letter}: başlık boş olduğu için yok sayıldı.`,
        auto_fixed: false
      });

      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        status: "ignored",
        confidence: 1,
        note: "Başlık boş olduğu için yok sayıldı."
      };
    }

    if (isSystemExportInfoHeader(normalizedHeader)) {
      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        status: "ignored",
        confidence: 1,
        note: "Sistem bilgisi — şu an içe aktarılmaz"
      };
    }

    const duplicateTargets = FIRST_DUPLICATE_HEADER_TARGETS[normalizedHeader];

    if (duplicateTargets) {
      const occurrence = duplicateHeaderCounts.get(normalizedHeader) ?? 0;
      duplicateHeaderCounts.set(normalizedHeader, occurrence + 1);
      const targetField = duplicateTargets[occurrence];

      if (targetField) {
        return {
          source_index: sourceIndex,
          source_column_letter,
          source_column_number,
          source_header: sourceHeader,
          normalized_header: normalizedHeader,
          target_field: targetField,
          status: "matched",
          confidence: 0.95,
          note: occurrence === 1 ? "İkinci Sınıf kolonu Öğrenci Grubu olarak yorumlandı." : undefined
        };
      }
    }

    const exactDefinition = findDefinitionByNormalizedHeader(normalizedHeader);

    if (exactDefinition) {
      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        target_field: exactDefinition.field,
        status: "matched",
        confidence: 1
      };
    }

    const misspelledDefinition = findMisspelledDefinitionByNormalizedHeader(normalizedHeader);

    if (misspelledDefinition) {
      logs.push({
        column_name: sourceHeader,
        column_letter: source_column_letter,
        column_number: source_column_number,
        severity: "info",
        message: `${formatColumnRef(sourceIndex, sourceHeader)} başlığı ${misspelledDefinition.label} alanıyla otomatik eşleştirildi.`,
        auto_fixed: true
      });

      return {
        source_index: sourceIndex,
        source_column_letter,
        source_column_number,
        source_header: sourceHeader,
        normalized_header: normalizedHeader,
        target_field: misspelledDefinition.field,
        status: "auto_fixed",
        confidence: 0.9,
        note: "Yazım hatası otomatik tanındı."
      };
    }

    return {
      source_index: sourceIndex,
      source_column_letter,
      source_column_number,
      source_header: sourceHeader,
      normalized_header: normalizedHeader,
      status: "mapping_required",
      confidence: 0,
      note: "Kolon için kullanıcı eşleştirmesi gerekli."
    };
  });

  return { matches, logs };
}
