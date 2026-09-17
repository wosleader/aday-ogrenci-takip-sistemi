import { AppDatabase } from "../../src/db/db";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { CampaignRecord } from "../../src/domain/models/campaign";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

export const REPORT_TIMESTAMP = "2026-05-10T12:00:00.000Z";

export async function createReportsDatabase(prefix = "test-dashboard") {
  const database = new AppDatabase(`${prefix}-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

export function makeStudent(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const name = overrides.student_full_name ?? "Test Student";
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: null,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}

export function makePhone(studentId: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const number = overrides.phone_number ?? "05321234567";
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: number,
    normalized_phone_number: overrides.normalized_phone_number ?? number,
    original_phone_value: number,
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}

export function makeCallLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "reached",
    note: null,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}

export function makeReminder(studentId: number, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-10T15:00:00.000Z",
    status: "pending",
    note: null,
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}

export function makeAppointment(studentId: number, overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    appointment_at: "2026-05-10T15:00:00.000Z",
    status: "pending",
    campaign_id: null,
    note: null,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}

export function makeCampaign(overrides: Partial<CampaignRecord> = {}): CampaignRecord {
  return {
    uuid: crypto.randomUUID(),
    name: "Test Campaign",
    is_default: false,
    is_active: true,
    sync_status: "local",
    created_at: REPORT_TIMESTAMP,
    updated_at: REPORT_TIMESTAMP,
    deleted_at: null,
    ...overrides
  };
}
