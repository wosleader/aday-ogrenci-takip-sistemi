import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AppointmentStatus } from "../../../domain/constants/statuses";
import { nowIso } from "../../../utils/dateTime";
import {
  readPendingAppointmentLifecycleContext,
  type PendingAppointmentLifecycleContext
} from "./appointmentOwnerIntegrity";
import { assertFutureAppointmentAt, calculateGuardianMessageDueTime } from "./guardianMessageDueTime";

type ExpectedUpdatedState = {
  expected_updated_at: string;
  performed_by?: string | null;
};

export type MarkGuardianMessageSentInput = ExpectedUpdatedState & {
  expected_guardian_message_generation: number;
  expected_guardian_message_due_at: string;
};

export type UpdatePendingAppointmentNoteInput = ExpectedUpdatedState & {
  note?: string | null;
};

export type ReschedulePendingAppointmentInput = ExpectedUpdatedState & {
  appointment_at: string;
};

export type CompletePendingAppointmentInput = ExpectedUpdatedState;
export type MarkPendingAppointmentNoShowInput = ExpectedUpdatedState;
export type CancelPendingAppointmentInput = ExpectedUpdatedState;

export type AppointmentLifecycleResult = {
  appointment_id: number;
  student_id: number;
  owner_call_log_id: number;
  status: AppointmentStatus;
  appointment_at: string;
  guardian_message_due_at: string | null;
  guardian_message_sent_at: string | null;
  guardian_message_generation: number | null;
  updated_at: string;
};

const STALE_APPOINTMENT_MESSAGE = "Randevu kaydı güncel değil. Sayfayı yenileyip yeniden deneyin.";
const GUARDIAN_MESSAGE_ALREADY_SENT = "Veli mesajı zaten gönderildi olarak işaretlenmiş.";

function assertExpectedUpdatedAt(context: PendingAppointmentLifecycleContext, expectedUpdatedAt: string): void {
  if (!expectedUpdatedAt || context.appointment.updated_at !== expectedUpdatedAt) {
    throw new Error(STALE_APPOINTMENT_MESSAGE);
  }
}

function createNextUpdatedAt(currentUpdatedAt: string): string {
  const currentTimestamp = new Date(currentUpdatedAt).getTime();
  const nowTimestamp = new Date(nowIso()).getTime();

  return new Date(Math.max(nowTimestamp, currentTimestamp + 1)).toISOString();
}

function createResult(
  context: PendingAppointmentLifecycleContext,
  update: Partial<AppointmentLifecycleResult>,
  timestamp: string
): AppointmentLifecycleResult {
  const appointment = context.appointment;
  const hasUpdate = (key: keyof AppointmentLifecycleResult) => Object.prototype.hasOwnProperty.call(update, key);

  return {
    appointment_id: appointment.id,
    student_id: appointment.student_id,
    owner_call_log_id: context.ownerCallLog.id,
    status: hasUpdate("status") ? update.status! : appointment.status,
    appointment_at: hasUpdate("appointment_at") ? update.appointment_at! : appointment.appointment_at,
    guardian_message_due_at: hasUpdate("guardian_message_due_at")
      ? update.guardian_message_due_at ?? null
      : appointment.guardian_message_due_at ?? null,
    guardian_message_sent_at: hasUpdate("guardian_message_sent_at")
      ? update.guardian_message_sent_at ?? null
      : appointment.guardian_message_sent_at ?? null,
    guardian_message_generation: hasUpdate("guardian_message_generation")
      ? update.guardian_message_generation ?? null
      : appointment.guardian_message_generation ?? null,
    updated_at: timestamp
  };
}

async function appendLifecycleAudit(
  database: AppDatabase,
  context: PendingAppointmentLifecycleContext,
  fieldName: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  note: string,
  performedBy: string | null | undefined,
  timestamp: string
): Promise<void> {
  await database.audit_logs.add({
    entity_type: "appointment",
    entity_id: context.appointment.id,
    action_type: "update",
    field_name: fieldName,
    old_value: JSON.stringify(oldValue),
    new_value: JSON.stringify(newValue),
    note,
    performed_by: performedBy?.trim() || "agent",
    created_at: timestamp
  });
}

async function runPendingAppointmentMutationWithDatabase(
  appointmentId: number,
  input: ExpectedUpdatedState,
  database: AppDatabase,
  mutate: (
    context: PendingAppointmentLifecycleContext,
    timestamp: string
  ) => Promise<AppointmentLifecycleResult>
): Promise<AppointmentLifecycleResult> {
  let result: AppointmentLifecycleResult | undefined;

  await database.transaction("rw", [database.appointments, database.call_logs, database.students, database.audit_logs], async () => {
    const context = await readPendingAppointmentLifecycleContext(appointmentId, database);
    assertExpectedUpdatedAt(context, input.expected_updated_at);
    result = await mutate(context, createNextUpdatedAt(context.appointment.updated_at));
  });

  if (!result) {
    throw new Error("Randevu kaydı güncellenemedi.");
  }

  return result;
}

export async function markGuardianMessageSent(
  appointmentId: number,
  input: MarkGuardianMessageSentInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return runPendingAppointmentMutationWithDatabase(appointmentId, input, database, async (context, timestamp) => {
    const appointment = context.appointment;

    if (
      appointment.guardian_message_sent_at !== null ||
      appointment.guardian_message_generation !== input.expected_guardian_message_generation ||
      appointment.guardian_message_due_at !== input.expected_guardian_message_due_at
    ) {
      throw new Error(appointment.guardian_message_sent_at !== null ? GUARDIAN_MESSAGE_ALREADY_SENT : STALE_APPOINTMENT_MESSAGE);
    }

    await database.appointments.update(appointment.id, {
      guardian_message_sent_at: timestamp,
      updated_at: timestamp
    });
    await appendLifecycleAudit(
      database,
      context,
      "appointment_guardian_message_sent",
      {
        guardian_message_sent_at: null,
        guardian_message_generation: appointment.guardian_message_generation,
        guardian_message_due_at: appointment.guardian_message_due_at
      },
      {
        guardian_message_sent_at: timestamp,
        guardian_message_generation: appointment.guardian_message_generation,
        guardian_message_due_at: appointment.guardian_message_due_at
      },
      "Veli mesajı gönderildi olarak işaretlendi.",
      input.performed_by,
      timestamp
    );

    return createResult(context, { guardian_message_sent_at: timestamp }, timestamp);
  });
}

export async function updatePendingAppointmentNote(
  appointmentId: number,
  input: UpdatePendingAppointmentNoteInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return runPendingAppointmentMutationWithDatabase(appointmentId, input, database, async (context, timestamp) => {
    const note = input.note?.trim() || null;

    await database.appointments.update(context.appointment.id, { note, updated_at: timestamp });
    await appendLifecycleAudit(
      database,
      context,
      "appointment_note_edit",
      { note: context.appointment.note ?? null },
      { note },
      "Randevu notu güncellendi.",
      input.performed_by,
      timestamp
    );

    return createResult(context, {}, timestamp);
  });
}

export async function reschedulePendingAppointment(
  appointmentId: number,
  input: ReschedulePendingAppointmentInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return runPendingAppointmentMutationWithDatabase(appointmentId, input, database, async (context, timestamp) => {
    const appointmentAt = assertFutureAppointmentAt(input.appointment_at.trim(), timestamp);
    const guardianMessage = calculateGuardianMessageDueTime(appointmentAt, timestamp);
    const nextGeneration = context.appointment.guardian_message_generation + 1;

    await database.appointments.update(context.appointment.id, {
      appointment_at: appointmentAt,
      guardian_message_due_at: guardianMessage.dueAt,
      guardian_message_generation: nextGeneration,
      guardian_message_sent_at: null,
      updated_at: timestamp
    });
    await appendLifecycleAudit(
      database,
      context,
      "appointment_reschedule",
      {
        appointment_at: context.appointment.appointment_at,
        guardian_message_due_at: context.appointment.guardian_message_due_at,
        guardian_message_generation: context.appointment.guardian_message_generation,
        guardian_message_sent_at: context.appointment.guardian_message_sent_at
      },
      {
        appointment_at: appointmentAt,
        guardian_message_due_at: guardianMessage.dueAt,
        guardian_message_generation: nextGeneration,
        guardian_message_sent_at: null
      },
      "Randevu tarihi/saat bilgisi ertelendi.",
      input.performed_by,
      timestamp
    );

    return createResult(
      context,
      {
        appointment_at: appointmentAt,
        guardian_message_due_at: guardianMessage.dueAt,
        guardian_message_generation: nextGeneration,
        guardian_message_sent_at: null
      },
      timestamp
    );
  });
}

async function transitionPendingAppointment(
  appointmentId: number,
  input: ExpectedUpdatedState,
  status: "completed" | "no_show" | "cancelled",
  fieldName: "appointment_complete" | "appointment_no_show" | "appointment_cancel",
  note: string,
  database: AppDatabase
): Promise<AppointmentLifecycleResult> {
  return runPendingAppointmentMutationWithDatabase(appointmentId, input, database, async (context, timestamp) => {
    await database.appointments.update(context.appointment.id, { status, updated_at: timestamp });
    await appendLifecycleAudit(
      database,
      context,
      fieldName,
      { status: "pending", appointment_at: context.appointment.appointment_at },
      { status, appointment_at: context.appointment.appointment_at },
      note,
      input.performed_by,
      timestamp
    );

    return createResult(context, { status }, timestamp);
  });
}

export function completePendingAppointment(
  appointmentId: number,
  input: CompletePendingAppointmentInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return transitionPendingAppointment(appointmentId, input, "completed", "appointment_complete", "Randevu geldi olarak tamamlandı.", database);
}

export function markPendingAppointmentNoShow(
  appointmentId: number,
  input: MarkPendingAppointmentNoShowInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return transitionPendingAppointment(appointmentId, input, "no_show", "appointment_no_show", "Randevu gelmedi olarak sonuçlandı.", database);
}

export function cancelPendingAppointment(
  appointmentId: number,
  input: CancelPendingAppointmentInput,
  database: AppDatabase = db
): Promise<AppointmentLifecycleResult> {
  return transitionPendingAppointment(appointmentId, input, "cancelled", "appointment_cancel", "Randevu iptal edildi.", database);
}
