import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { GuardianRelationType } from "../../../domain/models/guardian";
import { createSearchText, normalizeText } from "../../../utils/normalizeText";
import { normalizePhone } from "../../../utils/normalizePhone";
import { nowIso } from "../../../utils/dateTime";
import { createUuid } from "../../../utils/id";
import { createPreImportBackup, type PreImportBackup } from "./importBackup";
import { createImportFingerprint } from "./importDuplicateGuard";
import { getAllImportLogs } from "./logExport";
import type {
  ImportSimulationSummary,
  ParsedWorksheet,
  SimulatedImportPhone,
  SimulatedImportRow
} from "./types";

export type ImportWriteResult = {
  import_id: number;
  created_students: number;
  created_guardians: number;
  created_phones: number;
  created_reminders: number;
  saved_import_logs: number;
  skipped_rows: number;
  backup: PreImportBackup;
};

type ImportWriterOptions = {
  database?: AppDatabase;
  backupProvider?: (database: AppDatabase) => Promise<PreImportBackup>;
  failAfterBackupForTest?: boolean;
  failAfterFirstStudentForTest?: boolean;
};

async function ensureDefaultCampaign(database: AppDatabase, timestamp: string): Promise<CampaignRecord> {
  const existingDefault =
    (await database.campaigns.filter((campaign) => campaign.is_default).first()) ??
    (await database.campaigns.where("name").equals("Diğer").first());

  if (existingDefault) {
    return existingDefault;
  }

  const campaign: CampaignRecord = {
    uuid: createUuid(),
    name: "Diğer",
    is_default: true,
    is_active: true,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
  const id = await database.campaigns.add(campaign);

  return { ...campaign, id };
}

type WritableImportPhone = {
  phone_number: string;
  normalized_phone_number: string;
  original_phone_value: string;
  phone_label: string;
  reference_label: string;
  relation_label: null;
  source_column: string | null;
  priority: number;
  is_valid: boolean;
  is_primary: boolean;
};

type ImportGuardian = {
  full_name: string;
  relation_type: GuardianRelationType;
};

function getImportGuardians(row: SimulatedImportRow): ImportGuardian[] {
  return [
    row.guardian_full_name ? { full_name: row.guardian_full_name, relation_type: "guardian" as const } : null,
    row.mother_full_name ? { full_name: row.mother_full_name, relation_type: "mother" as const } : null,
    row.father_full_name ? { full_name: row.father_full_name, relation_type: "father" as const } : null
  ].filter((guardian): guardian is ImportGuardian => guardian !== null);
}

function getLegacyPhoneLabel(phone: Pick<SimulatedImportPhone, "field" | "reference_label">): string {
  if (phone.field === "phone_1") {
    return "Telefon 1";
  }

  if (phone.field === "phone_2") {
    return "Telefon 2";
  }

  return phone.reference_label;
}

function uniquePhones(row: SimulatedImportRow): WritableImportPhone[] {
  const seen = new Set<string>();

  if (row.phones?.length > 0) {
    return row.phones.flatMap((phone) => {
      if (!phone.normalized_phone_number || seen.has(phone.normalized_phone_number)) {
        return [];
      }

      seen.add(phone.normalized_phone_number);

      return [
        {
          phone_number: phone.phone_number,
          normalized_phone_number: phone.normalized_phone_number,
          original_phone_value: phone.raw_value,
          phone_label: getLegacyPhoneLabel(phone),
          reference_label: getLegacyPhoneLabel(phone),
          relation_label: null,
          source_column: phone.source_column || null,
          priority: phone.priority,
          is_valid: phone.is_valid,
          is_primary: seen.size === 1
        }
      ];
    });
  }

  const phones = [
    { value: row.phone_1, label: "Telefon 1", priority: 1 },
    { value: row.phone_2, label: "Telefon 2", priority: 2 }
  ].filter((phone) => Boolean(phone.value));

  return phones.flatMap((phone) => {
    const normalized = normalizePhone(phone.value);

    if (!normalized.normalized_phone_number || seen.has(normalized.normalized_phone_number)) {
      return [];
    }

    seen.add(normalized.normalized_phone_number);

    return [
      {
        phone_number: normalized.phone_number,
        normalized_phone_number: normalized.normalized_phone_number,
        original_phone_value: phone.value ?? "",
        phone_label: phone.label,
        reference_label: phone.label,
        relation_label: null,
        source_column: null,
        priority: phone.priority,
        is_valid: normalized.is_valid,
        is_primary: seen.size === 1
      }
    ];
  });
}

function getSearchPhones(row: SimulatedImportRow): string[] {
  if (row.phones?.length > 0) {
    return row.phones.map((phone) => phone.normalized_phone_number);
  }

  return [row.phone_1, row.phone_2].filter(Boolean) as string[];
}

export async function writeImportToDatabase(
  worksheet: ParsedWorksheet,
  summary: ImportSimulationSummary,
  options: ImportWriterOptions = {}
): Promise<ImportWriteResult> {
  const database = options.database ?? db;
  const backupProvider = options.backupProvider ?? createPreImportBackup;
  const backup = await backupProvider(database);

  if (!backup) {
    throw new Error("Import öncesi yedek alınamadı; kayıt yazma işlemi başlatılmadı.");
  }

  if (options.failAfterBackupForTest) {
    throw new Error("Test rollback hatası.");
  }

  const startedAt = nowIso();
  const allLogs = getAllImportLogs(summary);
  const warningCount = allLogs.filter((log) => log.severity === "warning").length;
  const errorCount = allLogs.filter((log) => log.severity === "error").length;
  const importFingerprint = createImportFingerprint(worksheet, summary);
  let result: ImportWriteResult | undefined;

  await database.transaction(
    "rw",
    [
      database.students,
      database.guardians,
      database.phones,
      database.reminders,
      database.campaigns,
      database.imports,
      database.import_logs,
      database.audit_logs
    ],
    async () => {
      const timestamp = nowIso();
      const campaign = await ensureDefaultCampaign(database, timestamp);
      const importId = await database.imports.add({
        uuid: createUuid(),
        file_name: worksheet.file_name,
        sheet_name: worksheet.sheet_name,
        total_rows: summary.total_rows,
        imported_rows: summary.readable_rows,
        skipped_rows: summary.skipped_rows,
        warning_count: warningCount,
        error_count: errorCount,
        started_at: startedAt,
        finished_at: null,
        header_row_number: worksheet.detected_header_row_number,
        file_size: worksheet.file_size ?? null,
        file_last_modified: worksheet.file_last_modified ?? null,
        import_fingerprint: importFingerprint,
        sync_status: "local",
        created_at: startedAt,
        updated_at: startedAt,
        deleted_at: null
      });

      await database.audit_logs.add({
        entity_type: "import",
        entity_id: importId,
        action_type: "import_started",
        note: `${worksheet.file_name} import işlemi başladı.`,
        created_at: timestamp
      });

      let createdGuardians = 0;
      let createdPhones = 0;
      let createdReminders = 0;

      for (const row of summary.simulated_rows) {
        const rowTimestamp = nowIso();
        const studentId = await database.students.add({
          uuid: createUuid(),
          student_full_name: row.student_full_name,
          normalized_student_name: normalizeText(row.student_full_name),
          search_text: createSearchText([
            row.student_full_name,
            row.guardian_full_name,
            row.mother_full_name,
            row.father_full_name,
            ...getSearchPhones(row),
            row.current_class,
            row.student_group
          ]),
          current_class: row.current_class ?? null,
          student_group: row.student_group ?? "11. Sınıf YKS Hazırlık",
          neighborhood: row.neighborhood ?? null,
          district: row.district ?? null,
          category: "YKS",
          campaign_id: campaign.id ?? null,
          lifecycle_status: "candidate",
          last_call_result: "not_called",
          source_file_name: worksheet.file_name,
          source_sheet_name: worksheet.sheet_name,
          source_row_number: row.row_number,
          general_note: row.general_note ?? null,
          sync_status: "local",
          created_at: rowTimestamp,
          updated_at: rowTimestamp,
          deleted_at: null
        });

        if (options.failAfterFirstStudentForTest) {
          throw new Error("Test transaction rollback hatası.");
        }

        let guardianId: number | null = null;

        for (const guardian of getImportGuardians(row)) {
          const createdGuardianId = await database.guardians.add({
            uuid: createUuid(),
            student_id: studentId,
            guardian_full_name: guardian.full_name,
            normalized_guardian_name: normalizeText(guardian.full_name),
            relation_type: guardian.relation_type,
            note: null,
            sync_status: "local",
            created_at: rowTimestamp,
            updated_at: rowTimestamp,
            deleted_at: null
          });

          if (guardian.relation_type === "guardian") {
            guardianId = createdGuardianId;
          }

          createdGuardians += 1;
        }

        for (const phone of uniquePhones(row)) {
          await database.phones.add({
            uuid: createUuid(),
            student_id: studentId,
            guardian_id: guardianId,
            phone_number: phone.phone_number,
            normalized_phone_number: phone.normalized_phone_number,
            original_phone_value: phone.original_phone_value,
            phone_label: phone.phone_label,
            reference_label: phone.reference_label,
            relation_label: phone.relation_label,
            source_column: phone.source_column,
            priority: phone.priority,
            is_valid: phone.is_valid,
            is_wrong: false,
            is_primary: phone.is_primary,
            note: null,
            sync_status: "local",
            created_at: rowTimestamp,
            updated_at: rowTimestamp,
            deleted_at: null
          });
          createdPhones += 1;
        }

        if (row.reminder_at) {
          await database.reminders.add({
            uuid: createUuid(),
            student_id: studentId,
            reminder_type: "call",
            reminder_at: row.reminder_at,
            status: "pending",
            note: null,
            is_default_time_assigned: summary.default_time_assigned_count > 0,
            sync_status: "local",
            created_at: rowTimestamp,
            updated_at: rowTimestamp,
            deleted_at: null
          });
          createdReminders += 1;
        }
      }

      await database.import_logs.bulkAdd(
        allLogs.map((log) => ({
          import_id: importId,
          row_number: log.row_number ?? null,
          column_name: log.column_name ?? log.column_letter ?? null,
          severity: log.severity,
          message: log.message,
          auto_fixed: log.auto_fixed,
          created_at: nowIso()
        }))
      );

      await database.audit_logs.bulkAdd([
        {
          entity_type: "import",
          entity_id: importId,
          action_type: "student_created",
          note: `${summary.readable_rows} öğrenci oluşturuldu.`,
          created_at: nowIso()
        },
        {
          entity_type: "import",
          entity_id: importId,
          action_type: "guardian_created",
          note: `${createdGuardians} veli oluşturuldu.`,
          created_at: nowIso()
        },
        {
          entity_type: "import",
          entity_id: importId,
          action_type: "phone_created",
          note: `${createdPhones} telefon oluşturuldu.`,
          created_at: nowIso()
        },
        {
          entity_type: "import",
          entity_id: importId,
          action_type: "reminder_created",
          note: `${createdReminders} hatırlatma oluşturuldu.`,
          created_at: nowIso()
        },
        {
          entity_type: "import",
          entity_id: importId,
          action_type: "import_completed",
          note: `${worksheet.file_name} import işlemi tamamlandı.`,
          created_at: nowIso()
        }
      ]);

      await database.imports.update(importId, {
        finished_at: nowIso(),
        updated_at: nowIso()
      });

      result = {
        import_id: importId,
        created_students: summary.readable_rows,
        created_guardians: createdGuardians,
        created_phones: createdPhones,
        created_reminders: createdReminders,
        saved_import_logs: allLogs.length,
        skipped_rows: summary.skipped_rows,
        backup
      };
    }
  );

  if (!result) {
    throw new Error("Import işlemi tamamlanamadı.");
  }

  return result;
}
