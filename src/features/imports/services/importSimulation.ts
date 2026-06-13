import { normalizePhone } from "../../../utils/normalizePhone";
import { normalizeText } from "../../../utils/normalizeText";
import { getImportFieldLabel, REQUIRED_IMPORT_FIELDS } from "./columnDefinitions";
import { matchColumns } from "./columnMatching";
import { normalizeReminderDate } from "./dateNormalization";
import { formatColumnRef } from "./excelColumns";
import type {
  ColumnMatch,
  DuplicatePhoneWarning,
  ImportEngineLog,
  ImportFieldKey,
  ImportPhoneFieldKey,
  ImportSimulationOptions,
  ImportSimulationSummary,
  ParsedWorksheet,
  SimulatedImportPhone,
  SimulatedImportRow
} from "./types";

const DEFAULT_SIMULATION_OPTIONS: ImportSimulationOptions = {
  defaultCampaignName: "Diğer",
  defaultReminderTime: "11:00",
  callStartTime: "10:00",
  callEndTime: "18:00"
};

const PHONE_IMPORT_FIELDS: ImportPhoneFieldKey[] = [
  "phone_1",
  "phone_2",
  "phone_3",
  "phone_4",
  "phone_5",
  "phone_6",
  "phone_7",
  "phone_8",
  "phone_9",
  "phone_10"
];

const FULL_NAME_OVERRIDES_SPLIT_NAME_MESSAGE =
  "Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı.";
const FIRST_NAME_ONLY_MESSAGE =
  "Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu.";
const LAST_NAME_ONLY_MESSAGE =
  "Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil.";

function stringifyCell(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function isEmptyRow(row: unknown[]): boolean {
  return row.every((cell) => stringifyCell(cell) === "");
}

function isTruthyImportFlag(value: unknown): boolean {
  const normalized = normalizeText(stringifyCell(value));

  if (!normalized) {
    return false;
  }

  return ["evet", "e", "true", "1", "x", "var", "aranacak", "tekrar aranacak"].includes(
    normalized
  );
}

function createFieldIndex(matches: ColumnMatch[]): Map<ImportFieldKey, number> {
  const fieldIndex = new Map<ImportFieldKey, number>();

  for (const match of matches) {
    if (match.target_field && !fieldIndex.has(match.target_field)) {
      fieldIndex.set(match.target_field, match.source_index);
    }
  }

  return fieldIndex;
}

function createFieldMatchIndex(matches: ColumnMatch[]): Map<ImportFieldKey, ColumnMatch> {
  const fieldMatchIndex = new Map<ImportFieldKey, ColumnMatch>();

  for (const match of matches) {
    if (match.target_field && !fieldMatchIndex.has(match.target_field)) {
      fieldMatchIndex.set(match.target_field, match);
    }
  }

  return fieldMatchIndex;
}

function getCell(row: unknown[], fieldIndex: Map<ImportFieldKey, number>, field: ImportFieldKey) {
  const index = fieldIndex.get(field);
  return index == null ? "" : row[index];
}

function getTextCell(
  row: unknown[],
  fieldIndex: Map<ImportFieldKey, number>,
  field: ImportFieldKey
): string {
  return stringifyCell(getCell(row, fieldIndex, field));
}

function hasSplitStudentNameSource(fieldIndex: Map<ImportFieldKey, number>): boolean {
  return fieldIndex.has("student_first_name") || fieldIndex.has("student_last_name");
}

function hasUsableStudentNameMapping(fieldIndex: Map<ImportFieldKey, number>): boolean {
  return fieldIndex.has("student_full_name") || fieldIndex.has("student_first_name");
}

function composeStudentNameParts(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function resolveStudentFullName(row: unknown[], fieldIndex: Map<ImportFieldKey, number>) {
  const fullName = getTextCell(row, fieldIndex, "student_full_name");
  const firstName = getTextCell(row, fieldIndex, "student_first_name");
  const lastName = getTextCell(row, fieldIndex, "student_last_name");

  if (fieldIndex.has("student_full_name")) {
    return {
      student_full_name: fullName,
      student_first_name: firstName || undefined,
      student_last_name: lastName || undefined
    };
  }

  if (firstName && lastName) {
    return {
      student_full_name: composeStudentNameParts(firstName, lastName),
      student_first_name: firstName,
      student_last_name: lastName
    };
  }

  if (firstName) {
    return {
      student_full_name: firstName,
      student_first_name: firstName,
      student_last_name: undefined,
      warning: FIRST_NAME_ONLY_MESSAGE
    };
  }

  if (lastName) {
    return {
      student_full_name: "",
      student_first_name: undefined,
      student_last_name: lastName,
      error: LAST_NAME_ONLY_MESSAGE
    };
  }

  return {
    student_full_name: "",
    student_first_name: undefined,
    student_last_name: undefined
  };
}

function collectImportPhones(
  row: unknown[],
  fieldIndex: Map<ImportFieldKey, number>,
  fieldMatchIndex: Map<ImportFieldKey, ColumnMatch>
): SimulatedImportPhone[] {
  const phones: SimulatedImportPhone[] = [];
  const seenPhoneNumbers = new Set<string>();

  PHONE_IMPORT_FIELDS.forEach((field, index) => {
    const rawValue = getTextCell(row, fieldIndex, field);

    if (!rawValue) {
      return;
    }

    const normalizedPhone = normalizePhone(rawValue);

    if (!normalizedPhone.normalized_phone_number || seenPhoneNumbers.has(normalizedPhone.normalized_phone_number)) {
      return;
    }

    const match = fieldMatchIndex.get(field);
    seenPhoneNumbers.add(normalizedPhone.normalized_phone_number);

    phones.push({
      field,
      source_index: match?.source_index ?? -1,
      source_header: match?.source_header ?? "",
      source_column_letter: match?.source_column_letter ?? "",
      raw_value: rawValue,
      phone_number: normalizedPhone.phone_number,
      normalized_phone_number: normalizedPhone.normalized_phone_number,
      reference_label: getImportFieldLabel(field),
      source_column: match?.source_header || getImportFieldLabel(field),
      priority: index + 1,
      is_valid: normalizedPhone.is_valid
    });
  });

  return phones;
}

function collectDuplicatePhoneWarnings(
  rows: SimulatedImportRow[]
): DuplicatePhoneWarning[] {
  const phoneMap = new Map<
    string,
    {
      rowNumbers: Set<number>;
      studentNames: Map<string, string>;
    }
  >();

  for (const row of rows) {
    const rowPhones = new Set(
      (row.phones.length ? row.phones.map((phone) => phone.normalized_phone_number) : [row.phone_1, row.phone_2])
        .filter(Boolean) as string[]
    );

    for (const phone of rowPhones) {
      const existing = phoneMap.get(phone) ?? {
        rowNumbers: new Set<number>(),
        studentNames: new Map<string, string>()
      };
      const normalizedStudentName = normalizeText(row.student_full_name);
      existing.rowNumbers.add(row.row_number);
      existing.studentNames.set(normalizedStudentName, row.student_full_name);
      phoneMap.set(phone, existing);
    }
  }

  return Array.from(phoneMap.entries())
    .filter(([, value]) => value.studentNames.size > 1)
    .map(([phoneNumber, value]) => ({
      phone_number: phoneNumber,
      row_numbers: Array.from(value.rowNumbers).sort((a, b) => a - b),
      student_names: Array.from(value.studentNames.values()).sort()
    }));
}

export function simulateImport(
  worksheet: ParsedWorksheet,
  options: Partial<ImportSimulationOptions> = {}
): ImportSimulationSummary {
  const effectiveOptions = { ...DEFAULT_SIMULATION_OPTIONS, ...options };
  const { matches, logs } = matchColumns(worksheet.headers, effectiveOptions.manualMappings);
  const fieldIndex = createFieldIndex(matches);
  const fieldMatchIndex = createFieldMatchIndex(matches);
  const simulationLogs: ImportEngineLog[] = [
    {
      severity: "info",
      message: `Algılanan başlık satırı: ${worksheet.detected_header_row_number}`,
      auto_fixed: true
    },
    ...logs
  ];
  const detailedLogs: ImportEngineLog[] = [];
  const simulatedRows: SimulatedImportRow[] = [];
  const missingRequiredFields: ImportSimulationSummary["missing_required_fields"] = [];
  let emptyRowCount = 0;
  let skippedRows = 0;
  let emptyPhoneCount = 0;
  let phone1EmptyWithAlternativeCount = 0;
  let bothPhonesEmptyCount = 0;
  let defaultCampaignAssignedCount = 0;
  let defaultTimeAssignedCount = 0;
  const hasCampaignColumn = fieldIndex.has("campaign_name");

  const mappingRequiredColumns = matches.filter((match) => match.status === "mapping_required");

  if (fieldIndex.has("student_full_name") && hasSplitStudentNameSource(fieldIndex)) {
    simulationLogs.push({
      field_name: "Ad Soyad",
      severity: "warning",
      message: FULL_NAME_OVERRIDES_SPLIT_NAME_MESSAGE,
      suggested_action: "Tam ad alanı kullanılacak; Ad ve Soyad kolonlarını ayrıca düzenlemeniz gerekmez.",
      auto_fixed: false
    });
  }

  for (const match of mappingRequiredColumns) {
    simulationLogs.push({
      column_name: match.source_header,
      column_letter: match.source_column_letter,
      column_number: match.source_column_number,
      severity: "warning",
      message: `${formatColumnRef(match.source_index, match.source_header)} eşleştirilemedi; kullanıcı eşleştirmesi gerekli.`,
      suggested_action: "Kolon Eşleştirme bölümünden bu Excel kolonunu uygun CRM alanına bağlayın.",
      auto_fixed: false
    });
  }

  for (const requiredField of REQUIRED_IMPORT_FIELDS) {
    if (requiredField === "student_full_name" && hasUsableStudentNameMapping(fieldIndex)) {
      continue;
    }

    if (!fieldIndex.has(requiredField)) {
      const fieldLabel = getImportFieldLabel(requiredField);
      simulationLogs.push({
        field_name: fieldLabel,
        severity: "error",
        message: `${fieldLabel} zorunlu alanı için eşleşen Excel kolonu bulunamadı.`,
        suggested_action: "Kolon Eşleştirme bölümünden zorunlu alanı seçip simülasyonu yeniden çalıştırın.",
        auto_fixed: false
      });
    }
  }

  if (!hasCampaignColumn) {
    simulationLogs.push({
      column_name: "Kampanya Tanımı",
      field_name: "Kampanya Tanımı",
      severity: "info",
      message: "Kampanya Tanımı kolonu bulunamadı. Okunacak kayıtların kampanyası Diğer yapılacak.",
      suggested_action: "Farklı bir kampanya gerekiyorsa Excel'e Kampanya Tanımı kolonu ekleyin veya eşleştirme yapın.",
      auto_fixed: true
    });
  }

  worksheet.rows.forEach((row, rowIndex) => {
    const rowNumber = worksheet.detected_header_row_number + rowIndex + 1;

    if (isEmptyRow(row)) {
      emptyRowCount += 1;
      skippedRows += 1;
      detailedLogs.push({
        row_number: rowNumber,
        severity: "warning",
        message: `Satır ${rowNumber} içe aktarılmayacak: satır tamamen boş.`,
        suggested_action: "Bu satırda aday bilgisi varsa Excel dosyasında ilgili alanları doldurun.",
        auto_fixed: false
      });
      return;
    }

    const resolvedStudentName = resolveStudentFullName(row, fieldIndex);
    const missingFields = REQUIRED_IMPORT_FIELDS.filter((field) => {
      if (field === "student_full_name") {
        return !resolvedStudentName.student_full_name;
      }

      return !getTextCell(row, fieldIndex, field);
    });

    if (missingFields.length > 0) {
      skippedRows += 1;

      for (const field of missingFields) {
        const fieldLabel = getImportFieldLabel(field);
        const message =
          field === "student_full_name" && resolvedStudentName.error
            ? `Satır ${rowNumber} içe aktarılmayacak: ${resolvedStudentName.error}`
            : `Satır ${rowNumber} içe aktarılmayacak: ${fieldLabel} alanı boş.`;
        missingRequiredFields.push({ row_number: rowNumber, field, message });
        detailedLogs.push({
          row_number: rowNumber,
          field_name: fieldLabel,
          severity: "error",
          message,
          suggested_action:
            field === "student_full_name" && resolvedStudentName.error
              ? "Ad alanını da eşleştirin veya tam Ad Soyad alanını kullanın."
              : `${fieldLabel} alanını Excel'de doldurun veya doğru kolonu eşleştirin.`,
          auto_fixed: false
        });
      }

      return;
    }

    if (resolvedStudentName.warning) {
      simulationLogs.push({
        row_number: rowNumber,
        field_name: "Ad Soyad",
        severity: "warning",
        message: resolvedStudentName.warning,
        suggested_action: "Soyad bilgisi varsa Excel'de Soyad kolonunu eşleştirebilirsiniz.",
        auto_fixed: false
      });
    }

    const studentFullName = resolvedStudentName.student_full_name;
    const phones = collectImportPhones(row, fieldIndex, fieldMatchIndex);
    const primaryPhone = normalizePhone(getTextCell(row, fieldIndex, "phone_1"));
    const secondaryPhoneRaw = getTextCell(row, fieldIndex, "phone_2");
    const secondaryPhone = secondaryPhoneRaw ? normalizePhone(secondaryPhoneRaw) : undefined;

    if (!primaryPhone.normalized_phone_number) {
      emptyPhoneCount += 1;
      if (phones.length > 0) {
        phone1EmptyWithAlternativeCount += 1;
        detailedLogs.push({
          row_number: rowNumber,
          column_name: "Telefon",
          field_name: "Telefon",
          severity: "info",
          message: `Satır ${rowNumber}: Telefon 1 boş, ancak alternatif telefon dolu olduğu için kayıt içe aktarılabilir.`,
          suggested_action: "Telefon 1 zorunlu değilse işlem yapmanız gerekmez; isterseniz numarayı Telefon 1'e taşıyın.",
          auto_fixed: false
        });
      } else {
        bothPhonesEmptyCount += 1;
        detailedLogs.push({
          row_number: rowNumber,
          column_name: "Telefon",
          field_name: "Telefon",
          severity: "warning",
          message: `Satır ${rowNumber}: Telefon 1 ve Telefon 2 boş. Bu kayıt kontrol edilmeli.`,
          suggested_action: "Adaya ulaşılabilmesi için en az bir telefon bilgisi ekleyin.",
          auto_fixed: false
        });
      }
    }

    let campaignName = getTextCell(row, fieldIndex, "campaign_name");

    if (!campaignName) {
      campaignName = effectiveOptions.defaultCampaignName;
      defaultCampaignAssignedCount += 1;
    }

    const shouldCallAgain = isTruthyImportFlag(getCell(row, fieldIndex, "should_call_again"));
    const reminderDateValue = getCell(row, fieldIndex, "reminder_date");
    const reminder = shouldCallAgain
      ? normalizeReminderDate(
          reminderDateValue,
          effectiveOptions.defaultReminderTime,
          effectiveOptions.callStartTime,
          effectiveOptions.callEndTime
        )
      : undefined;

    if (reminder?.default_time_assigned && reminder.reminder_at) {
      defaultTimeAssignedCount += 1;
      simulationLogs.push({
        row_number: rowNumber,
        column_name: "Tekrar Aranacak Tarih",
        field_name: "Tekrar Aranacak Tarih",
        severity: "info",
        message: `Satır ${rowNumber}: tekrar arama tarihi var ama saat boş. Sistem bu kaydı ${effectiveOptions.defaultReminderTime} olarak planlayacak.`,
        suggested_action: "Farklı bir saat gerekiyorsa Excel'de tekrar arama saatini belirtin.",
        auto_fixed: true
      });
    }

    if (reminder?.outside_call_hours && reminder.reminder_at) {
      simulationLogs.push({
        row_number: rowNumber,
        column_name: "Tekrar Aranacak Tarih",
        field_name: "Tekrar Aranacak Tarih",
        severity: "warning",
        message: `Satır ${rowNumber}: tekrar arama saati ${effectiveOptions.callStartTime}-${effectiveOptions.callEndTime} aralığı dışında.`,
        suggested_action: "Gerekirse tekrar arama saatini ayarlardaki çalışma saatleri içine alın.",
        auto_fixed: false
      });
    }

    simulatedRows.push({
      row_number: rowNumber,
      current_class: getTextCell(row, fieldIndex, "current_class") || undefined,
      student_group: getTextCell(row, fieldIndex, "student_group") || undefined,
      student_first_name: resolvedStudentName.student_first_name,
      student_last_name: resolvedStudentName.student_last_name,
      student_full_name: studentFullName,
      guardian_full_name: getTextCell(row, fieldIndex, "guardian_full_name") || undefined,
      mother_full_name: getTextCell(row, fieldIndex, "mother_full_name") || undefined,
      father_full_name: getTextCell(row, fieldIndex, "father_full_name") || undefined,
      neighborhood: getTextCell(row, fieldIndex, "neighborhood") || undefined,
      district: getTextCell(row, fieldIndex, "district") || undefined,
      phone_1: primaryPhone.normalized_phone_number || undefined,
      phone_2: secondaryPhone?.normalized_phone_number || undefined,
      phones,
      last_call_result: getTextCell(row, fieldIndex, "last_call_result") || undefined,
      should_call_again: shouldCallAgain,
      general_note: getTextCell(row, fieldIndex, "general_note") || undefined,
      reminder_at: reminder?.reminder_at,
      campaign_name: campaignName
    });
  });

  const duplicatePhoneWarnings = collectDuplicatePhoneWarnings(simulatedRows);

  if (missingRequiredFields.length > 0) {
    simulationLogs.push({
      severity: "error",
      message: `${missingRequiredFields.length} satır içe aktarılmayacak: zorunlu alan bilgisi eksik.`,
      suggested_action: "Detayları göster bölümünden satırları kontrol edin ve eksik zorunlu alanları tamamlayın.",
      auto_fixed: false
    });
  }

  if (phone1EmptyWithAlternativeCount > 0) {
    simulationLogs.push({
      severity: "info",
      message: `${phone1EmptyWithAlternativeCount} kayıtta Telefon 1 boş, ancak alternatif telefon bulunduğu için kayıtlar içe aktarılabilir.`,
      suggested_action: "Bu kayıtlar içe aktarılabilir; isterseniz Telefon 1 alanlarını Excel'de tamamlayın.",
      auto_fixed: false
    });
  }

  if (bothPhonesEmptyCount > 0) {
    simulationLogs.push({
      severity: "warning",
      message: `${bothPhonesEmptyCount} kayıtta Telefon 1 ve Telefon 2 boş. Bu kayıtlar kontrol edilmeli.`,
      suggested_action: "Bu adaylara ulaşmak için en az bir telefon bilgisi ekleyin.",
      auto_fixed: false
    });
  }

  if (emptyRowCount > 0) {
    simulationLogs.push({
      severity: "warning",
      message: `${emptyRowCount} boş satır içe aktarılmayacak.`,
      suggested_action: "Excel dosyasında gereksiz boş satırları temizleyebilirsiniz.",
      auto_fixed: false
    });
  }

  for (const warning of duplicatePhoneWarnings) {
    simulationLogs.push({
      severity: "warning",
      message: `Mükerrer telefon uyarısı: ${warning.phone_number} numarası ${warning.student_names.length} farklı öğrencide geçiyor. Satırlar: ${warning.row_numbers.join(", ")}. Öğrenciler: ${warning.student_names.join(", ")}.`,
      suggested_action: "Aynı telefonun birden fazla adaya ait olup olmadığını kontrol edin.",
      auto_fixed: false
    });
  }

  return {
    total_rows: worksheet.rows.length,
    readable_rows: simulatedRows.length,
    skipped_rows: skippedRows,
    auto_matched_columns: matches.filter((match) => match.status === "auto_fixed"),
    mapping_required_columns: mappingRequiredColumns,
    missing_required_fields: missingRequiredFields,
    empty_row_count: emptyRowCount,
    empty_phone_count: emptyPhoneCount,
    phone1_empty_with_alternative_count: phone1EmptyWithAlternativeCount,
    both_phones_empty_count: bothPhonesEmptyCount,
    duplicate_phone_warnings: duplicatePhoneWarnings,
    default_campaign_assigned_count: defaultCampaignAssignedCount,
    default_time_assigned_count: defaultTimeAssignedCount,
    logs: simulationLogs,
    detailed_logs: detailedLogs,
    simulated_rows: simulatedRows,
    preview_rows: simulatedRows.slice(0, 20)
  };
}
