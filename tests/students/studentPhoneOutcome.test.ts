import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { updatePhoneOutcome } from "../../src/features/students/services/studentPhoneOutcome";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";
async function createDatabase() {
  const database = new AppDatabase(`test-phone-outcome-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name = "Ayse Yilmaz"): StudentRecord {
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

function phone(studentId: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = overrides.phone_number ?? "05321234567";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: overrides.normalized_phone_number ?? phoneNumber,
    original_phone_value: phoneNumber,
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
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("studentPhoneOutcome", () => {
  it("updates only the selected phone outcome without changing phone action fields or student summary", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstPhoneId = await database.phones.add(phone(studentId));
      const secondPhoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          reference_label: "Telefon 2",
          priority: 2,
          is_primary: false,
          phone_status: "invalid",
          is_wrong: true,
          is_valid: false
        })
      );

      const result = await updatePhoneOutcome(firstPhoneId, "no_answer", database);
      const updatedFirstPhone = await database.phones.get(firstPhoneId);
      const untouchedSecondPhone = await database.phones.get(secondPhoneId);
      const unchangedStudent = await database.students.get(studentId);

      expect(result).toMatchObject({
        phone_id: firstPhoneId,
        student_id: studentId,
        call_outcome: "no_answer",
        call_outcome_updated_at: expect.any(String)
      });
      expect(updatedFirstPhone).toMatchObject({
        call_outcome: "no_answer",
        call_outcome_updated_at: expect.any(String),
        phone_status: "active",
        is_wrong: false,
        is_valid: true
      });
      expect(untouchedSecondPhone).toMatchObject({
        phone_status: "invalid",
        is_wrong: true,
        is_valid: false
      });
      expect(untouchedSecondPhone?.call_outcome).toBeUndefined();
      expect(untouchedSecondPhone?.call_outcome_updated_at).toBeUndefined();
      expect(unchangedStudent?.last_call_result).toBe("not_called");
      expect(unchangedStudent?.last_contacted_at).toBeUndefined();
      expect(unchangedStudent?.last_contacted_phone_id).toBeUndefined();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("stores manual Aranmadı reset separately from legacy fallback", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          call_outcome: "reached",
          call_outcome_updated_at: "2026-05-08T10:00:00.000Z"
        })
      );

      await updatePhoneOutcome(phoneId, "not_called", database);
      const updatedPhone = await database.phones.get(phoneId);

      expect(updatedPhone?.call_outcome).toBe("not_called");
      expect(updatedPhone?.call_outcome_updated_at).toBeTruthy();
      expect(updatedPhone?.call_outcome_updated_at).not.toBe("2026-05-08T10:00:00.000Z");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not share outcome between duplicate normalized phones on different candidates", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student("Ayse Yilmaz"));
      const secondStudentId = await database.students.add(student("Elif Yilmaz"));
      const firstPhoneId = await database.phones.add(phone(firstStudentId));
      const secondPhoneId = await database.phones.add(phone(secondStudentId));

      await updatePhoneOutcome(firstPhoneId, "busy", database);
      const firstPhone = await database.phones.get(firstPhoneId);
      const secondPhone = await database.phones.get(secondPhoneId);

      expect(firstPhone?.normalized_phone_number).toBe(secondPhone?.normalized_phone_number);
      expect(firstPhone?.call_outcome).toBe("busy");
      expect(secondPhone?.call_outcome).toBeUndefined();
    } finally {
      database.close();
      await database.delete();
    }
  });
});
