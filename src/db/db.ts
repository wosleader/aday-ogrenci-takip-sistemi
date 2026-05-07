import Dexie, { type Table } from "dexie";
import type { AppointmentRecord } from "../domain/models/appointment";
import type { AuditLogRecord } from "../domain/models/auditLog";
import type { CallLogRecord } from "../domain/models/callLog";
import type { CampaignRecord } from "../domain/models/campaign";
import type { DuplicateCheckRecord } from "../domain/models/duplicateCheck";
import type { GuardianRecord } from "../domain/models/guardian";
import type { ImportLogRecord, ImportRecord } from "../domain/models/importLog";
import type { PhoneRecord } from "../domain/models/phone";
import type { ReminderRecord } from "../domain/models/reminder";
import type { KeyboardShortcutRecord, SettingRecord } from "../domain/models/setting";
import type { StudentRecord } from "../domain/models/student";
import { DATABASE_NAME, DATABASE_VERSION, STORES } from "./schema";

export class AppDatabase extends Dexie {
  students!: Table<StudentRecord, number>;
  guardians!: Table<GuardianRecord, number>;
  phones!: Table<PhoneRecord, number>;
  call_logs!: Table<CallLogRecord, number>;
  reminders!: Table<ReminderRecord, number>;
  appointments!: Table<AppointmentRecord, number>;
  campaigns!: Table<CampaignRecord, number>;
  imports!: Table<ImportRecord, number>;
  import_logs!: Table<ImportLogRecord, number>;
  duplicate_checks!: Table<DuplicateCheckRecord, number>;
  audit_logs!: Table<AuditLogRecord, number>;
  settings!: Table<SettingRecord, string>;
  keyboard_shortcuts!: Table<KeyboardShortcutRecord, number>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(DATABASE_VERSION).stores(STORES);
  }
}

export const db = new AppDatabase();
