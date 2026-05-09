import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CallResult, LifecycleStatus } from "../../../domain/constants/statuses";
import type { PhoneRecord } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";
import { createUuid } from "../../../utils/id";

export type CallLogWriteInput = {
  student_id: number;
  guardian_id?: number | null;
  contacted_phone_id?: number | null;
  call_result: CallResult;
  note?: string | null;
  reminder_at?: string | null;
  campaign_id?: number | null;
  created_by?: string | null;
};

export type CallLogWriteOptions = {
  database?: AppDatabase;
  failAfterCallLogForTest?: boolean;
};

export type CallLogWriteResult = {
  call_log_id: number;
  student_id: number;
  contacted_phone_id?: number | null;
  created_reminder_id?: number | null;
  updated_existing_reminder: boolean;
};

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function isEligibleContactPhone(phone: PhoneRecord): boolean {
  return isActive(phone) && !phone.is_wrong && phone.phone_status !== "invalid";
}

function lifecycleFromCallResult(callResult: CallResult, currentLifecycleStatus: LifecycleStatus): LifecycleStatus {
  if (callResult === "do_not_call") {
    return "do_not_call";
  }

  if (callResult === "registered") {
    return "registered";
  }

  return currentLifecycleStatus === "do_not_call" || currentLifecycleStatus === "registered"
    ? currentLifecycleStatus
    : "candidate";
}

async function resolveContactPhone(
  database: AppDatabase,
  studentId: number,
  contactedPhoneId?: number | null
): Promise<(PhoneRecord & { id: number }) | null> {
  const phones = (await database.phones.where("student_id").equals(studentId).toArray()).flatMap((phone) =>
    phone.id ? [phone as PhoneRecord & { id: number }] : []
  );

  if (contactedPhoneId) {
    const phone = phones.find((studentPhone) => studentPhone.id === contactedPhoneId);

    if (!phone) {
      throw new Error("Seçilen telefon bu adaya ait değil.");
    }

    if (!isEligibleContactPhone(phone)) {
      throw new Error("Yanlış numara / kullanılmıyor işaretli telefon görüşülen numara olarak seçilemez.");
    }

    return phone;
  }

  const eligiblePhones = phones.filter(isEligibleContactPhone);

  if (eligiblePhones.length === 1) {
    return eligiblePhones[0];
  }

  if (eligiblePhones.length > 1) {
    throw new Error("Hangi numarayla görüşüldü? Lütfen Telefon 1 veya Telefon 2 için ✓ işaretleyin.");
  }

  return null;
}

async function keepOnlySelectedPhoneContacted(
  database: AppDatabase,
  studentId: number,
  selectedPhoneId?: number | null
) {
  if (!selectedPhoneId) {
    return;
  }

  const timestamp = nowIso();
  const phones = await database.phones.where("student_id").equals(studentId).toArray();

  await Promise.all(
    phones.flatMap((phone) => {
      if (!phone.id) {
        return [];
      }

      if (phone.id === selectedPhoneId) {
        return database.phones.update(phone.id, {
          phone_status: "contacted",
          is_wrong: false,
          updated_at: timestamp
        });
      }

      if (phone.phone_status === "contacted") {
        return database.phones.update(phone.id, {
          phone_status: "active",
          updated_at: timestamp
        });
      }

      return [];
    })
  );
}

export async function writeCallLog(
  input: CallLogWriteInput,
  options: CallLogWriteOptions = {}
): Promise<CallLogWriteResult> {
  const database = options.database ?? db;
  let result: CallLogWriteResult | undefined;

  await database.transaction(
    "rw",
    [database.students, database.phones, database.call_logs, database.reminders, database.audit_logs],
    async () => {
      const student = await database.students.get(input.student_id);

      if (!student?.id || student.deleted_at) {
        throw new Error("Aday kaydı bulunamadı.");
      }

      const timestamp = nowIso();
      const contactedPhone = await resolveContactPhone(database, student.id, input.contacted_phone_id);
      const trimmedNote = input.note?.trim() || null;
      const callLogId = await database.call_logs.add({
        uuid: createUuid(),
        student_id: student.id,
        guardian_id: input.guardian_id ?? null,
        phone_id: contactedPhone?.id ?? null,
        contacted_phone_id: contactedPhone?.id ?? null,
        contacted_phone_number: contactedPhone?.phone_number ?? null,
        contacted_phone_label: contactedPhone?.phone_label ?? null,
        call_time: timestamp,
        call_result: input.call_result,
        note: trimmedNote,
        reminder_at: input.reminder_at ?? null,
        next_action: input.reminder_at ? "Tekrar arama" : null,
        created_by: input.created_by ?? "system",
        created_reminder_id: null,
        created_appointment_id: null,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      if (options.failAfterCallLogForTest) {
        throw new Error("Test transaction rollback hatası.");
      }

      await keepOnlySelectedPhoneContacted(database, student.id, contactedPhone?.id ?? null);

      let reminderId: number | null = null;
      let updatedExistingReminder = false;

      if (input.reminder_at) {
        const existingReminder = (
          await database.reminders.where("student_id").equals(student.id).toArray()
        ).find((reminder) => isActive(reminder) && reminder.reminder_type === "call" && reminder.status === "pending");

        if (existingReminder?.id) {
          reminderId = existingReminder.id;
          updatedExistingReminder = true;
          await database.reminders.update(existingReminder.id, {
            reminder_at: input.reminder_at,
            call_log_id: callLogId,
            note: trimmedNote,
            is_default_time_assigned: false,
            updated_at: timestamp
          });
        } else {
          reminderId = await database.reminders.add({
            uuid: createUuid(),
            student_id: student.id,
            call_log_id: callLogId,
            reminder_type: "call",
            reminder_at: input.reminder_at,
            status: "pending",
            note: trimmedNote,
            is_default_time_assigned: false,
            sync_status: "local",
            created_at: timestamp,
            updated_at: timestamp,
            deleted_at: null
          });
        }

        await database.call_logs.update(callLogId, {
          created_reminder_id: reminderId,
          updated_at: timestamp
        });
      }

      await database.students.update(student.id, {
        last_call_result: input.call_result,
        lifecycle_status: lifecycleFromCallResult(input.call_result, student.lifecycle_status),
        last_contacted_at: timestamp,
        last_contacted_phone_id: contactedPhone?.id ?? null,
        updated_at: timestamp
      });

      await database.audit_logs.add({
        entity_type: "call_log",
        entity_id: callLogId,
        action_type: "create",
        note: `${student.student_full_name} için görüşme kaydı oluşturuldu.`,
        performed_by: input.created_by ?? "system",
        created_at: timestamp
      });

      result = {
        call_log_id: callLogId,
        student_id: student.id,
        contacted_phone_id: contactedPhone?.id ?? null,
        created_reminder_id: reminderId,
        updated_existing_reminder: updatedExistingReminder
      };
    }
  );

  if (!result) {
    throw new Error("Görüşme kaydı oluşturulamadı.");
  }

  return result;
}
