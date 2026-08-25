import type { AppDatabase } from "./db";
import { db } from "./db";
import {
  PILOT_SEED_APPOINTMENTS,
  PILOT_SEED_CALL_LOGS,
  PILOT_SEED_CANDIDATES,
  PILOT_SEED_EXPECTED_COUNTS,
  PILOT_SEED_GUARDIANS,
  PILOT_SEED_PHONES,
  PILOT_SEED_REMINDERS
} from "./pilotSeedData";
import type { AppointmentStatus, CallResult, ReminderStatus, StudentCategory } from "../domain/constants/statuses";
import type { GuardianRelationType } from "../domain/models/guardian";
import type { PhoneRelationLabel, PhoneSnapshot } from "../domain/models/phone";
import { createStudentSearchText } from "../features/students/services/studentSearchText";
import { createUuid } from "../utils/id";
import { normalizeText } from "../utils/normalizeText";
import { normalizePhone } from "../utils/normalizePhone";

type PilotSeedStats = {
  appointments: number;
  callLogs: number;
  guardians: number;
  phones: number;
  reminders: number;
  students: number;
};

type CreatedPhoneInfo = {
  dbId: number;
  candidateId: string;
  phoneNumber: string;
  referenceLabel: string;
  relationLabel: PhoneRelationLabel;
  sourceColumn: string | null;
};

const PILOT_SEED_ENABLED = "true";
const PILOT_SOURCE = "pilot_demo_seed_70_aday_390_telefon.xlsx";
let activePilotSeedBootstrap: Promise<PilotSeedStats | null> | null = null;

async function isPilotSeedEnabled(): Promise<boolean> {
  return import.meta.env.VITE_ENABLE_PILOT_SEED === PILOT_SEED_ENABLED;
}

async function hasMeaningfulData(database: AppDatabase): Promise<boolean> {
  const [students, guardians, phones, callLogs, reminders, appointments] = await Promise.all([
    database.students.count(),
    database.guardians.count(),
    database.phones.count(),
    database.call_logs.count(),
    database.reminders.count(),
    database.appointments.count()
  ]);

  return students + guardians + phones + callLogs + reminders + appointments > 0;
}

function categoryFor(currentClass: string): StudentCategory {
  if (currentClass === "YKS") {
    return "YKS";
  }

  if (currentClass === "8. Sınıf" || currentClass === "LGS") {
    return "LGS";
  }

  return "Diger";
}

function studentGroupFor(currentClass: string): string {
  if (currentClass === "LGS") {
    return "LGS Hazırlık";
  }

  if (currentClass === "YKS") {
    return "YKS Hazırlık";
  }

  return `${currentClass} Demo Grup`;
}

function relationTypeFor(value: string): GuardianRelationType {
  const normalized = normalizeText(value);

  if (normalized.includes("anne")) {
    return "mother";
  }

  if (normalized.includes("baba")) {
    return "father";
  }

  return "guardian";
}

function relationLabelFor(value?: string | null): PhoneRelationLabel {
  const normalized = normalizeText(value ?? "");

  if (normalized.includes("anne")) {
    return "Anne";
  }

  if (normalized.includes("baba")) {
    return "Baba";
  }

  if (normalized.includes("ogrenci")) {
    return "Öğrenci";
  }

  if (normalized.includes("veli")) {
    return "Veli";
  }

  if (normalized.includes("acil") || normalized.includes("dede") || normalized.includes("nine") || normalized.includes("yakin")) {
    return "Yakın";
  }

  if (normalized.includes("ev")) {
    return "Diğer";
  }

  return "Telefon";
}

function callResultFor(value: string): CallResult {
  if (value === "no_answer") {
    return "not_reached";
  }

  if (
    value === "not_called" ||
    value === "not_reached" ||
    value === "reached" ||
    value === "call_later" ||
    value === "appointment" ||
    value === "do_not_call" ||
    value === "wrong_number" ||
    value === "registered" ||
    value === "not_interested"
  ) {
    return value;
  }

  return "not_called";
}

function reminderStatusFor(value: string): ReminderStatus {
  if (value === "completed") {
    return "completed";
  }

  if (value === "cancelled") {
    return "cancelled";
  }

  return "pending";
}

function appointmentStatusFor(value: string): AppointmentStatus {
  if (value === "visited") {
    return "attended";
  }

  if (value === "no_show") {
    return "missed";
  }

  if (value === "postponed") {
    return "postponed";
  }

  if (value === "cancelled") {
    return "cancelled";
  }

  if (value === "registered") {
    return "registered";
  }

  return "pending";
}

function parseSourceRowNumber(candidateId: string): number | null {
  const match = candidateId.match(/\d+/);

  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function createPhoneSnapshot(phone: CreatedPhoneInfo | undefined): PhoneSnapshot | null {
  if (!phone) {
    return null;
  }

  return {
    phone_id: phone.dbId,
    reference_label: phone.referenceLabel,
    relation_label: phone.relationLabel,
    phone_number: phone.phoneNumber,
    source_column: phone.sourceColumn
  };
}

function byTimeDesc(left: { call_time: string; id: number }, right: { call_time: string; id: number }): number {
  return right.call_time.localeCompare(left.call_time) || right.id - left.id;
}

export async function createPilotSeed(database: AppDatabase = db): Promise<PilotSeedStats> {
  const timestamp = new Date().toISOString();
  const defaultCampaign = await database.campaigns.where("is_default").equals(1).first();
  const campaignId = defaultCampaign?.id ?? null;
  const stats: PilotSeedStats = {
    appointments: 0,
    callLogs: 0,
    guardians: 0,
    phones: 0,
    reminders: 0,
    students: 0
  };

  await database.transaction(
    "rw",
    [database.students, database.guardians, database.phones, database.call_logs, database.reminders, database.appointments],
    async () => {
      const studentIds = new Map<string, number>();
      const guardianIds = new Map<string, number>();
      const phonesByFixtureId = new Map<string, CreatedPhoneInfo>();
      const callLogsByCandidate = new Map<string, Array<{ call_time: string; call_result: CallResult; phone_id: number | null; id: number }>>();

      for (const candidate of PILOT_SEED_CANDIDATES) {
        const guardiansForCandidate = PILOT_SEED_GUARDIANS.filter((guardian) => guardian.candidate_id === candidate.candidate_id);
        const phonesForCandidate = PILOT_SEED_PHONES.filter((phone) => phone.candidate_id === candidate.candidate_id);
        const studentId = await database.students.add({
          uuid: createUuid(),
          student_full_name: candidate.student_name,
          normalized_student_name: normalizeText(candidate.student_name),
          search_text: createStudentSearchText({
            student_full_name: candidate.student_name,
            guardian_names: guardiansForCandidate.map((guardian) => guardian.guardian_name),
            phone_values: phonesForCandidate.map((phone) => phone.phone_number),
            current_class: candidate.class_group,
            student_group: studentGroupFor(candidate.class_group),
            district: candidate.district,
            neighborhood: null
          }),
          current_class: candidate.class_group,
          student_group: studentGroupFor(candidate.class_group),
          neighborhood: null,
          district: candidate.district,
          category: categoryFor(candidate.class_group),
          campaign_id: campaignId,
          lifecycle_status: "candidate",
          last_call_result: callResultFor(candidate.general_status_key_suggestion),
          last_contacted_at: null,
          last_contacted_phone_id: null,
          source_file_name: PILOT_SOURCE,
          source_sheet_name: "Candidates",
          source_row_number: parseSourceRowNumber(candidate.candidate_id),
          general_note: candidate.candidate_note,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });

        studentIds.set(candidate.candidate_id, studentId);
        stats.students += 1;
      }

      for (const guardian of PILOT_SEED_GUARDIANS) {
        const studentId = studentIds.get(guardian.candidate_id);

        if (!studentId) {
          continue;
        }

        const guardianId = await database.guardians.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_full_name: guardian.guardian_name,
          normalized_guardian_name: normalizeText(guardian.guardian_name),
          relation_type: relationTypeFor(guardian.relation),
          note: guardian.guardian_note,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });

        guardianIds.set(guardian.guardian_id, guardianId);
        stats.guardians += 1;
      }

      for (const phone of PILOT_SEED_PHONES) {
        const studentId = studentIds.get(phone.candidate_id);

        if (!studentId) {
          continue;
        }

        const normalizedPhone = normalizePhone(phone.phone_number);
        const referenceLabel = `Telefon ${phone.phone_slot}`;
        const relationLabel = relationLabelFor(phone.guardian_relation);
        const guardianId = phone.guardian_id ? guardianIds.get(phone.guardian_id) ?? null : null;
        const isWrong = phone.phone_outcome_key === "wrong_number" || phone.phone_outcome_key === "unused";
        const phoneId = await database.phones.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_id: guardianId,
          phone_number: phone.phone_number,
          normalized_phone_number: normalizedPhone.normalized_phone_number,
          original_phone_value: phone.phone_number,
          phone_label: phone.phone_label,
          reference_label: referenceLabel,
          relation_label: relationLabel,
          source_column: phone.phone_label.toLocaleUpperCase("tr-TR"),
          priority: phone.phone_slot,
          phone_status: "active",
          is_valid: Boolean(normalizedPhone.normalized_phone_number),
          is_wrong: isWrong,
          is_primary: phone.is_primary === "EVET",
          call_outcome: phone.phone_outcome_key,
          call_outcome_updated_at: timestamp,
          note: phone.phone_note,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });

        phonesByFixtureId.set(phone.phone_id, {
          dbId: phoneId,
          candidateId: phone.candidate_id,
          phoneNumber: phone.phone_number,
          referenceLabel,
          relationLabel,
          sourceColumn: phone.phone_label.toLocaleUpperCase("tr-TR")
        });
        stats.phones += 1;
      }

      for (const callLog of PILOT_SEED_CALL_LOGS) {
        const studentId = studentIds.get(callLog.candidate_id);
        const phone = phonesByFixtureId.get(callLog.phone_id);

        if (!studentId) {
          continue;
        }

        const callResult = callResultFor(callLog.call_result_key_suggestion);
        const callLogId = await database.call_logs.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_id: null,
          phone_id: phone?.dbId ?? null,
          phone_snapshot: createPhoneSnapshot(phone),
          contacted_phone_id: phone?.dbId ?? null,
          contacted_phone_number: phone?.phoneNumber ?? null,
          contacted_phone_label: phone?.referenceLabel ?? null,
          call_time: callLog.call_time,
          call_result: callResult,
          note: callLog.call_note,
          reminder_at: callResult === "call_later" ? callLog.call_time : null,
          next_action: callResult === "call_later" ? "Demo veri: tekrar arama planlandı." : null,
          created_by: "pilot-seed",
          created_reminder_id: null,
          created_appointment_id: null,
          sync_status: "local",
          created_at: callLog.call_time,
          updated_at: callLog.call_time,
          deleted_at: null
        });

        callLogsByCandidate.set(callLog.candidate_id, [
          ...(callLogsByCandidate.get(callLog.candidate_id) ?? []),
          { call_time: callLog.call_time, call_result: callResult, phone_id: phone?.dbId ?? null, id: callLogId }
        ]);
        stats.callLogs += 1;
      }

      for (const [candidateId, callLogs] of callLogsByCandidate.entries()) {
        const studentId = studentIds.get(candidateId);
        const latestCallLog = [...callLogs].sort(byTimeDesc)[0];

        if (!studentId || !latestCallLog) {
          continue;
        }

        await database.students.update(studentId, {
          last_call_result: latestCallLog.call_result,
          last_contacted_at: latestCallLog.call_time,
          last_contacted_phone_id: latestCallLog.phone_id
        });
      }

      for (const reminder of PILOT_SEED_REMINDERS) {
        const studentId = studentIds.get(reminder.candidate_id);
        const phone = phonesByFixtureId.get(reminder.phone_id);

        if (!studentId) {
          continue;
        }

        await database.reminders.add({
          uuid: createUuid(),
          student_id: studentId,
          call_log_id: null,
          phone_id: phone?.dbId ?? null,
          phone_snapshot: createPhoneSnapshot(phone),
          reminder_type: "call",
          reminder_at: reminder.reminder_at,
          status: reminderStatusFor(reminder.reminder_status_key_suggestion),
          note: reminder.reminder_note,
          is_default_time_assigned: false,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });
        stats.reminders += 1;
      }

      for (const appointment of PILOT_SEED_APPOINTMENTS) {
        const studentId = studentIds.get(appointment.candidate_id);
        const guardianId = guardianIds.get(appointment.guardian_id) ?? null;

        if (!studentId) {
          continue;
        }

        await database.appointments.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_id: guardianId,
          appointment_at: appointment.appointment_at,
          status: appointmentStatusFor(appointment.appointment_status_key_suggestion),
          campaign_id: campaignId,
          note: appointment.appointment_note,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });
        stats.appointments += 1;
      }
    }
  );

  return stats;
}

export async function bootstrapPilotSeedIfNeeded(
  database: AppDatabase = db,
  enabled?: boolean
): Promise<PilotSeedStats | null> {
  const shouldSeed = enabled ?? (await isPilotSeedEnabled());

  if (!shouldSeed) {
    return null;
  }

  if (activePilotSeedBootstrap) {
    return activePilotSeedBootstrap;
  }

  activePilotSeedBootstrap = (async () => {
    if (await hasMeaningfulData(database)) {
      return null;
    }

    const stats = await createPilotSeed(database);
    console.info("Pilot demo verisi yüklendi.", stats, PILOT_SEED_EXPECTED_COUNTS);
    return stats;
  })();

  try {
    return await activePilotSeedBootstrap;
  } finally {
    activePilotSeedBootstrap = null;
  }
}
