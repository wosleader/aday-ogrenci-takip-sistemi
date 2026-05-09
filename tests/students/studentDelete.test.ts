import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { deleteStudentWithRelations } from "../../src/features/students/services/studentDelete";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-delete-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name: string): StudentRecord {
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
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
}

function guardian(studentId: number): GuardianRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: "Veli Yilmaz",
    normalized_guardian_name: "veli yilmaz",
    relation_type: null,
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
}

function phone(studentId: number): PhoneRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: "05321234567",
    normalized_phone_number: "05321234567",
    original_phone_value: "05321234567",
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
}

function reminder(studentId: number): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00",
    status: "pending",
    note: null,
    is_default_time_assigned: true,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
}

describe("deleteStudentWithRelations", () => {
  it("deletes one student and direct relations without touching other students", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student("Ayse Yilmaz"));
      const secondStudentId = await database.students.add(student("Mehmet Kaya"));
      await database.guardians.bulkAdd([guardian(firstStudentId), guardian(secondStudentId)]);
      await database.phones.bulkAdd([phone(firstStudentId), phone(secondStudentId)]);
      await database.reminders.bulkAdd([reminder(firstStudentId), reminder(secondStudentId)]);
      await database.appointments.add({
        uuid: crypto.randomUUID(),
        student_id: firstStudentId,
        guardian_id: null,
        appointment_at: "2026-05-20T14:00:00",
        status: "pending",
        campaign_id: null,
        note: null,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      const result = await deleteStudentWithRelations(firstStudentId, database);

      expect(result).toMatchObject({
        deleted_students: 1,
        deleted_guardians: 1,
        deleted_phones: 1,
        deleted_reminders: 1,
        deleted_appointments: 1
      });
      expect(await database.students.get(firstStudentId)).toBeUndefined();
      expect(await database.students.get(secondStudentId)).toBeDefined();
      expect(await database.guardians.where("student_id").equals(secondStudentId).count()).toBe(1);
      expect(await database.phones.where("student_id").equals(secondStudentId).count()).toBe(1);
      expect(await database.reminders.where("student_id").equals(secondStudentId).count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
