import type { AppDatabase } from "./db";
import { db } from "./db";
import { PILOT_SEED_CANDIDATES } from "./pilotSeedData";
import type { AppointmentStatus, CallResult, StudentCategory } from "../domain/constants/statuses";
import type { PhoneCallOutcome, PhoneRelationLabel, PhoneSnapshot } from "../domain/models/phone";
import { createUuid } from "../utils/id";
import { createSearchText, normalizeText } from "../utils/normalizeText";
import { normalizePhone } from "../utils/normalizePhone";

type PilotSeedStats = {
  appointments: number;
  callLogs: number;
  guardians: number;
  phones: number;
  reminders: number;
  students: number;
};

const PILOT_SEED_ENABLED = "true";
const PILOT_SOURCE = "pilot-demo-seed";
const PHONE_OUTCOME_SEQUENCE: PhoneCallOutcome[] = [
  "not_called",
  "no_answer",
  "busy",
  "closed",
  "reached",
  "wrong_number",
  "unused"
];
const EXTRA_CALL_RESULT_SEQUENCE: CallResult[] = [
  "reached",
  "not_reached",
  "call_later",
  "appointment",
  "wrong_number"
];
const CALL_NOTES = [
  "Demo veri: veli yaz kampı hakkında bilgi aldı.",
  "Demo veri: tekrar aranacak, karar için baba ile görüşecek.",
  "Demo veri: randevu oluşturuldu, kurum tanıtımı yapılacak.",
  "Demo veri: numara hatalı görünüyor.",
  "Demo veri: öğrenci LGS hazırlık için bilgi istiyor.",
  "Demo veri: YKS program seçenekleri anlatıldı.",
  "Demo veri: deneme dersi sonrası kayıt görüşmesi planlanacak."
];

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

function addDays(base: Date, days: number, hour: number, minute = 0): string {
  const nextDate = new Date(base);
  nextDate.setDate(base.getDate() + days);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate.toISOString();
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

function phoneNumberFor(index: number): string {
  const suffix = String(index + 1000).padStart(4, "0");
  return `0500 000 ${suffix.slice(0, 2)} ${suffix.slice(2)}`;
}

function phoneSnapshot(phoneId: number, phoneNumber: string, referenceLabel: string, relationLabel: PhoneRelationLabel): PhoneSnapshot {
  return {
    phone_id: phoneId,
    reference_label: referenceLabel,
    relation_label: relationLabel,
    phone_number: phoneNumber,
    source_column: referenceLabel
  };
}

function guardianName(studentName: string, relation: "Anne" | "Baba"): string {
  const surname = studentName.trim().split(/\s+/).at(-1) ?? "Veli";
  return `${relation} ${surname}`;
}

export async function createPilotSeed(database: AppDatabase = db): Promise<PilotSeedStats> {
  const now = new Date();
  const timestamp = now.toISOString();
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
      let phoneSequence = 1;

      for (const [index, candidate] of PILOT_SEED_CANDIDATES.entries()) {
        const candidateNumber = index + 1;
        const classGroup = studentGroupFor(candidate.currentClass);
        const searchParts = [candidate.name, candidate.currentClass, classGroup];
        const lastContactedAt = addDays(now, -(index % 7), 10 + (index % 7), index % 4 === 0 ? 30 : 0);
        const studentId = await database.students.add({
          uuid: createUuid(),
          student_full_name: candidate.name,
          normalized_student_name: normalizeText(candidate.name),
          search_text: createSearchText(searchParts),
          current_class: candidate.currentClass,
          student_group: classGroup,
          neighborhood: index % 3 === 0 ? "Cumhuriyet" : index % 3 === 1 ? "Atatürk" : "Merkez",
          district: index % 4 === 0 ? "Osmangazi" : index % 4 === 1 ? "Nilüfer" : index % 4 === 2 ? "Yıldırım" : "Kadıköy",
          category: categoryFor(candidate.currentClass),
          campaign_id: campaignId,
          lifecycle_status: candidate.status === "registered" ? "registered" : "candidate",
          last_call_result: candidate.status,
          last_contacted_at: lastContactedAt,
          last_contacted_phone_id: null,
          source_file_name: PILOT_SOURCE,
          source_sheet_name: "Pilot Demo",
          source_row_number: candidateNumber,
          general_note: `Demo veri: ${candidate.currentClass} pilot aday kaydı.`,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });
        stats.students += 1;

        const motherGuardianId = await database.guardians.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_full_name: guardianName(candidate.name, "Anne"),
          normalized_guardian_name: normalizeText(guardianName(candidate.name, "Anne")),
          relation_type: "mother",
          note: "Demo veri: anne veli kaydı.",
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });
        const fatherGuardianId = await database.guardians.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_full_name: guardianName(candidate.name, "Baba"),
          normalized_guardian_name: normalizeText(guardianName(candidate.name, "Baba")),
          relation_type: "father",
          note: "Demo veri: baba veli kaydı.",
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        });
        stats.guardians += 2;

        const phonePlans: Array<{
          guardianId: number | null;
          label: string;
          priority: number;
          relation: PhoneRelationLabel;
        }> = [
          { guardianId: motherGuardianId, label: "Anne Telefon", priority: 1, relation: "Anne" },
          { guardianId: fatherGuardianId, label: "Baba Telefon", priority: 2, relation: "Baba" }
        ];

        if (index < 20) {
          phonePlans.push({ guardianId: null, label: index % 2 === 0 ? "Öğrenci Telefon" : "Veli Alternatif", priority: 3, relation: index % 2 === 0 ? "Öğrenci" : "Veli" });
        }

        const phoneIds: number[] = [];

        for (const phonePlan of phonePlans) {
          const displayNumber = phoneNumberFor(phoneSequence);
          const normalizedPhone = normalizePhone(displayNumber);
          const outcome = PHONE_OUTCOME_SEQUENCE[(phoneSequence - 1) % PHONE_OUTCOME_SEQUENCE.length];
          const phoneId = await database.phones.add({
            uuid: createUuid(),
            student_id: studentId,
            guardian_id: phonePlan.guardianId,
            phone_number: displayNumber,
            normalized_phone_number: normalizedPhone.normalized_phone_number,
            original_phone_value: displayNumber,
            phone_label: phonePlan.label,
            reference_label: `Telefon ${phonePlan.priority}`,
            relation_label: phonePlan.relation,
            source_column: phonePlan.label.toLocaleUpperCase("tr-TR"),
            priority: phonePlan.priority,
            phone_status: "active",
            is_valid: true,
            is_wrong: outcome === "wrong_number" || outcome === "unused",
            is_primary: phonePlan.priority === 1,
            call_outcome: outcome,
            call_outcome_updated_at: addDays(now, -(index % 5), 11, phonePlan.priority * 5),
            note: "Demo veri: kurgusal telefon kaydı.",
            sync_status: "local",
            created_at: timestamp,
            updated_at: timestamp,
            deleted_at: null
          });
          phoneIds.push(phoneId);
          phoneSequence += 1;
          stats.phones += 1;
        }

        const primaryPhoneId = phoneIds[0] ?? null;
        await database.students.update(studentId, {
          last_contacted_phone_id: primaryPhoneId
        });

        const primaryPhone = primaryPhoneId ? await database.phones.get(primaryPhoneId) : null;
        const primarySnapshot =
          primaryPhoneId && primaryPhone
            ? phoneSnapshot(primaryPhoneId, primaryPhone.phone_number, primaryPhone.reference_label ?? "Telefon 1", primaryPhone.relation_label ?? "Telefon")
            : null;

        await database.call_logs.add({
          uuid: createUuid(),
          student_id: studentId,
          guardian_id: motherGuardianId,
          phone_id: primaryPhoneId,
          phone_snapshot: primarySnapshot,
          contacted_phone_id: primaryPhoneId,
          contacted_phone_number: primaryPhone?.phone_number ?? null,
          contacted_phone_label: primaryPhone?.reference_label ?? "Telefon 1",
          call_time: lastContactedAt,
          call_result: candidate.status,
          note: CALL_NOTES[index % CALL_NOTES.length],
          reminder_at: candidate.status === "call_later" ? addDays(now, 1 + (index % 5), 14, 0) : null,
          next_action: candidate.status === "call_later" ? "Demo veri: tekrar arama planlandı." : null,
          created_by: "pilot-seed",
          created_reminder_id: null,
          created_appointment_id: null,
          sync_status: "local",
          created_at: lastContactedAt,
          updated_at: lastContactedAt,
          deleted_at: null
        });
        stats.callLogs += 1;

        if (index < 40) {
          const extraCallTime = addDays(now, -((index % 6) + 1), 9 + (index % 4), 15);
          await database.call_logs.add({
            uuid: createUuid(),
            student_id: studentId,
            guardian_id: fatherGuardianId,
            phone_id: phoneIds[1] ?? primaryPhoneId,
            phone_snapshot:
              phoneIds[1] && (await database.phones.get(phoneIds[1]))
                ? phoneSnapshot(
                    phoneIds[1],
                    (await database.phones.get(phoneIds[1]))?.phone_number ?? "",
                    (await database.phones.get(phoneIds[1]))?.reference_label ?? "Telefon 2",
                    (await database.phones.get(phoneIds[1]))?.relation_label ?? "Baba"
                  )
                : primarySnapshot,
            contacted_phone_id: phoneIds[1] ?? primaryPhoneId,
            contacted_phone_number: (phoneIds[1] ? (await database.phones.get(phoneIds[1]))?.phone_number : primaryPhone?.phone_number) ?? null,
            contacted_phone_label: (phoneIds[1] ? (await database.phones.get(phoneIds[1]))?.reference_label : primaryPhone?.reference_label) ?? "Telefon 2",
            call_time: extraCallTime,
            call_result: EXTRA_CALL_RESULT_SEQUENCE[index % EXTRA_CALL_RESULT_SEQUENCE.length],
            note: CALL_NOTES[(index + 2) % CALL_NOTES.length],
            reminder_at: null,
            next_action: null,
            created_by: "pilot-seed",
            created_reminder_id: null,
            created_appointment_id: null,
            sync_status: "local",
            created_at: extraCallTime,
            updated_at: extraCallTime,
            deleted_at: null
          });
          stats.callLogs += 1;
        }

        if (candidate.status === "call_later" || index < 6) {
          const reminderIndex = stats.reminders;
          const reminderStatus = reminderIndex < 10 ? "pending" : reminderIndex < 15 ? "pending" : reminderIndex < 17 ? "completed" : "cancelled";
          await database.reminders.add({
            uuid: createUuid(),
            student_id: studentId,
            call_log_id: null,
            phone_id: primaryPhoneId,
            phone_snapshot: primarySnapshot,
            reminder_type: reminderIndex % 2 === 0 ? "call" : "follow_up",
            reminder_at: reminderIndex < 10 ? addDays(now, 1 + (reminderIndex % 7), 13, 30) : addDays(now, -1 - (reminderIndex % 5), 10, 0),
            status: reminderStatus,
            note:
              reminderIndex % 3 === 0
                ? "Demo veri: veli karar için tekrar aranacak."
                : reminderIndex % 3 === 1
                  ? "Demo veri: deneme dersi sonrası kayıt görüşmesi yapılacak."
                  : "Demo veri: fiyat bilgisi için baba ile görüşülecek.",
            is_default_time_assigned: false,
            sync_status: "local",
            created_at: timestamp,
            updated_at: timestamp,
            deleted_at: null
          });
          stats.reminders += 1;
        }

        if (candidate.status === "appointment" || index < 4) {
          const appointmentIndex = stats.appointments;
          const statusSequence: AppointmentStatus[] = ["pending", "attended", "postponed", "missed"];
          await database.appointments.add({
            uuid: createUuid(),
            student_id: studentId,
            guardian_id: motherGuardianId,
            appointment_at: addDays(now, appointmentIndex % 2 === 0 ? appointmentIndex % 6 : -1 * (appointmentIndex % 3), 15, appointmentIndex % 2 === 0 ? 0 : 30),
            status: statusSequence[appointmentIndex % statusSequence.length],
            campaign_id: campaignId,
            note:
              candidate.currentClass === "YKS"
                ? "Demo veri: YKS program tanıtımı."
                : candidate.currentClass === "LGS"
                  ? "Demo veri: LGS hazırlık kayıt görüşmesi."
                  : "Demo veri: ücretsiz yaz kampı bilgilendirme görüşmesi.",
            sync_status: "local",
            created_at: timestamp,
            updated_at: timestamp,
            deleted_at: null
          });
          stats.appointments += 1;
        }
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

  if (await hasMeaningfulData(database)) {
    return null;
  }

  const stats = await createPilotSeed(database);
  console.info("Pilot demo verisi yüklendi.", stats);
  return stats;
}
