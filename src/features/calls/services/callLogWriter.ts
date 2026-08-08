import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { isReminderCallResult, type CallResult, type LifecycleStatus } from "../../../domain/constants/statuses";
import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { PhoneRecord } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";
import { createUuid } from "../../../utils/id";
import { calculateGuardianMessageDueTime } from "../../appointments/services/guardianMessageDueTime";
import { createPhoneSnapshot } from "../../students/services/phoneCompatibility";
import {
  areAllPhonesInvalidOrWrong,
  isSelectableCallPhone,
  requiresCallPhoneSelection
} from "./callSaveValidation";

export type CallLogWriteInput = {
  student_id: number;
  guardian_id?: number | null;
  contacted_phone_id?: number | null;
  call_result: CallResult;
  note?: string | null;
  reminder_at?: string | null;
  appointment_at?: string | null;
  campaign_id?: number | null;
  created_by?: string | null;
};

export type CallLogWriteOptions = {
  database?: AppDatabase;
  failAfterCallLogForTest?: boolean;
  failAfterAppointmentAddForTest?: boolean;
  failAfterAppointmentLinkForTest?: boolean;
};

export type CallLogWriteResult = {
  call_log_id: number;
  student_id: number;
  contacted_phone_id?: number | null;
  created_reminder_id?: number | null;
  created_appointment_id?: number | null;
  updated_existing_reminder: boolean;
};

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function isEligibleContactPhone(phone: PhoneRecord): boolean {
  return isActive(phone) && isSelectableCallPhone(phone);
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

function resolveAppointmentAt(input: CallLogWriteInput, timestamp: string): string | null {
  if (input.call_result !== "appointment") {
    return null;
  }

  if (!input.appointment_at?.trim()) {
    throw new Error("Randevu tarihi/saat bilgisi zorunludur.");
  }

  const appointmentAt = input.appointment_at.trim();
  const appointmentTime = new Date(appointmentAt).getTime();

  if (Number.isNaN(appointmentTime)) {
    throw new Error("Randevu tarihi/saat bilgisi geçersiz.");
  }

  if (appointmentTime <= new Date(timestamp).getTime()) {
    throw new Error("Randevu tarihi/saat bilgisi gelecekte olmalıdır.");
  }

  calculateGuardianMessageDueTime(appointmentAt, timestamp);

  return appointmentAt;
}

function isActivePendingAppointmentForOwner(appointment: AppointmentRecord, callLogId: number): boolean {
  return !appointment.deleted_at && appointment.status === "pending" && appointment.call_log_id === callLogId;
}

async function assertNoActiveCanonicalAppointmentForOwner(
  database: AppDatabase,
  studentId: number,
  callLogId: number
): Promise<void> {
  const ownerAppointments = (await database.appointments.toArray()).filter(
    (appointment) => !appointment.deleted_at && appointment.call_log_id === callLogId
  );

  if (ownerAppointments.some((appointment) => appointment.student_id !== studentId)) {
    throw new Error("Randevu sahibi aday ile görüşme kaydı uyuşmuyor.");
  }

  if (ownerAppointments.some((appointment) => isActivePendingAppointmentForOwner(appointment, callLogId))) {
    throw new Error("Bu görüşme kaydı için zaten açık bir randevu bulunuyor.");
  }
}

async function resolveContactPhone(
  database: AppDatabase,
  studentId: number,
  callResult: CallResult,
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
      throw new Error("Yanlış numara / kullanılmıyor işaretli telefon bu kayıt için seçilemez.");
    }

    return phone;
  }

  const activePhones = phones.filter(isActive);
  const eligiblePhones = activePhones.filter(isSelectableCallPhone);

  if (callResult !== "wrong_number" && eligiblePhones.length === 1) {
    return eligiblePhones[0];
  }

  if (callResult === "wrong_number") {
    if (eligiblePhones.length === 0 && areAllPhonesInvalidOrWrong(activePhones)) {
      return null;
    }

    if (eligiblePhones.length > 0) {
      throw new Error("Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.");
    }
  }

  if (requiresCallPhoneSelection(callResult)) {
    if (eligiblePhones.length === 0) {
      throw new Error("Bu kayıt için seçilebilir telefon bulunmadı.");
    }

    if (eligiblePhones.length > 1) {
      throw new Error("Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.");
    }
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
    [database.students, database.phones, database.call_logs, database.reminders, database.appointments, database.audit_logs],
    async () => {
      const student = await database.students.get(input.student_id);

      if (!student?.id || student.deleted_at) {
        throw new Error("Aday kaydı bulunamadı.");
      }

      const timestamp = nowIso();
      const contactedPhone = await resolveContactPhone(
        database,
        student.id,
        input.call_result,
        input.contacted_phone_id
      );
      const phoneSnapshot = contactedPhone ? createPhoneSnapshot(contactedPhone) : null;
      const trimmedNote = input.note?.trim() || null;
      const callLogReminderAt = isReminderCallResult(input.call_result) ? input.reminder_at ?? null : null;
      const appointmentAt = resolveAppointmentAt(input, timestamp);
      const callLogId = await database.call_logs.add({
        uuid: createUuid(),
        student_id: student.id,
        guardian_id: input.guardian_id ?? null,
        phone_id: contactedPhone?.id ?? null,
        phone_snapshot: phoneSnapshot,
        contacted_phone_id: contactedPhone?.id ?? null,
        contacted_phone_number: contactedPhone?.phone_number ?? null,
        contacted_phone_label: contactedPhone?.phone_label ?? null,
        call_time: timestamp,
        call_result: input.call_result,
        note: trimmedNote,
        reminder_at: callLogReminderAt,
        next_action: callLogReminderAt ? "Tekrar arama" : null,
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
      let appointmentId: number | null = null;
      let updatedExistingReminder = false;

      if (callLogReminderAt) {
        const existingReminder = (
          await database.reminders.where("student_id").equals(student.id).toArray()
        ).find((reminder) => isActive(reminder) && reminder.reminder_type === "call" && reminder.status === "pending");

        if (existingReminder?.id) {
          reminderId = existingReminder.id;
          updatedExistingReminder = true;
          await database.reminders.update(existingReminder.id, {
            reminder_at: callLogReminderAt,
            call_log_id: callLogId,
            phone_id: contactedPhone?.id ?? null,
            phone_snapshot: phoneSnapshot,
            note: trimmedNote,
            is_default_time_assigned: false,
            updated_at: timestamp
          });
        } else {
          reminderId = await database.reminders.add({
            uuid: createUuid(),
            student_id: student.id,
            call_log_id: callLogId,
            phone_id: contactedPhone?.id ?? null,
            phone_snapshot: phoneSnapshot,
            reminder_type: "call",
            reminder_at: callLogReminderAt,
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

      if (appointmentAt) {
        await assertNoActiveCanonicalAppointmentForOwner(database, student.id, callLogId);
        const guardianMessage = calculateGuardianMessageDueTime(appointmentAt, timestamp);
        appointmentId = await database.appointments.add({
          uuid: createUuid(),
          student_id: student.id,
          guardian_id: input.guardian_id ?? null,
          appointment_at: appointmentAt,
          status: "pending",
          campaign_id: input.campaign_id ?? null,
          note: trimmedNote,
          call_log_id: callLogId,
          guardian_message_due_at: guardianMessage.dueAt,
          guardian_message_sent_at: null,
          guardian_message_generation: 1,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });

        if (options.failAfterAppointmentAddForTest) {
          throw new Error("Test appointment create rollback hatası.");
        }

        const appointment = await database.appointments.get(appointmentId);

        if (
          !appointment ||
          appointment.deleted_at ||
          appointment.student_id !== student.id ||
          appointment.call_log_id !== callLogId ||
          appointment.status !== "pending"
        ) {
          throw new Error("Randevu kaydı güvenle doğrulanamadı.");
        }

        const reciprocalUpdateCount = await database.call_logs.update(callLogId, {
          created_appointment_id: appointmentId,
          updated_at: timestamp
        });

        if (reciprocalUpdateCount !== 1) {
          throw new Error("Randevu bağlantısı oluşturulamadı.");
        }

        if (options.failAfterAppointmentLinkForTest) {
          throw new Error("Test reciprocal link rollback hatası.");
        }
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

      if (appointmentId) {
        const appointment = await database.appointments.get(appointmentId);
        const linkedCallLog = await database.call_logs.get(callLogId);

        if (
          !appointment ||
          !linkedCallLog ||
          appointment.student_id !== student.id ||
          appointment.call_log_id !== callLogId ||
          linkedCallLog.created_appointment_id !== appointmentId ||
          linkedCallLog.call_result !== "appointment" ||
          linkedCallLog.created_reminder_id
        ) {
          throw new Error("Randevu bağlantısı güvenle doğrulanamadı.");
        }

        await database.audit_logs.add({
          entity_type: "appointment",
          entity_id: appointmentId,
          action_type: "create",
          field_name: "appointment_create",
          old_value: null,
          new_value: JSON.stringify({
            appointment_id: appointmentId,
            owner_call_log_id: callLogId,
            initial_status: appointment.status,
            appointment_at: appointment.appointment_at,
            guardian_message_due_at: appointment.guardian_message_due_at ?? null,
            guardian_message_generation: appointment.guardian_message_generation ?? null
          }),
          note: "Randevu kaydı oluşturuldu.",
          performed_by: input.created_by ?? "system",
          created_at: timestamp
        });
      }

      result = {
        call_log_id: callLogId,
        student_id: student.id,
        contacted_phone_id: contactedPhone?.id ?? null,
        created_reminder_id: reminderId,
        created_appointment_id: appointmentId,
        updated_existing_reminder: updatedExistingReminder
      };
    }
  );

  if (!result) {
    throw new Error("Görüşme kaydı oluşturulamadı.");
  }

  return result;
}
